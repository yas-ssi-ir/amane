"""
AMANE - Module d'Inférence IA
Utilise un modèle ResNet18 pré-entraîné adapté pour la classification
de lésions cutanées (7 catégories).
Pas d'entraînement from scratch — Transfer Learning uniquement.
"""

import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import uuid
import time
import math
import os
import json


# Seuil par defaut si evaluation_report.json absent (premier run, avant evaluate.py)
DEFAULT_UNCERTAINTY_THRESHOLD = 0.60

# Out-of-distribution detection
# - Si la confiance max est < OOD_MAX_PROB_THRESHOLD : modele pas sur d'aucune classe
# - Si l'entropie normalisee est > OOD_ENTROPY_THRESHOLD : distribution proche de l'uniforme
# Une seule des deux conditions suffit a flagger l'image comme hors distribution.
OOD_MAX_PROB_THRESHOLD = 0.50
OOD_ENTROPY_THRESHOLD = 0.85


class AmaneClassifier:
    """
    Classificateur de lésions cutanées basé sur ResNet18.
    Utilise les poids pré-entraînés ImageNet et adapte la dernière couche
    pour 7 catégories dermatologiques.
    """

    # Les 7 catégories de lésions cutanées (basées sur le dataset HAM10000)
    CLASSES = [
    "mel",
    "nv",
    "bcc",
    "akiec",
    "bkl",
    "df",
    "vasc",
    ]

    LABEL_MAP = {
    "mel": "Mélanome",
    "nv": "Naevus mélanocytaire",
    "bcc": "Carcinome basocellulaire",
    "akiec": "Kératose actinique",
    "bkl": "Kératose bénigne",
    "df": "Dermatofibrome",
    "vasc": "Lésion vasculaire",
    }


    # Niveau de risque associé à chaque catégorie
    RISK_MAP = {
    "mel": "CRITICAL",
    "bcc": "HIGH",
    "akiec": "MEDIUM",
    "bkl": "LOW",
    "nv": "LOW",
    "df": "LOW",
    "vasc": "MEDIUM",
    }

    def __init__(self):
        """Charge le modèle — entraîné sur HAM10000 si disponible, sinon pré-entraîné ImageNet."""
        # Chemin vers le modèle fine-tuné sur HAM10000
        self.model_path = os.path.join(
            os.path.dirname(__file__), "models", "amane_skin_v1.pth"
        )
        self.report_path = os.path.join(
            os.path.dirname(__file__), "models", "evaluation_report.json"
        )
        self.calibration_path = os.path.join(
            os.path.dirname(__file__), "models", "calibration.json"
        )

        # Charger ResNet18
        self.model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

        # Architecture de la couche finale (identique à train.py)
        num_features = self.model.fc.in_features
        self.model.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, len(self.CLASSES)),
        )

        # Charger les poids entraînés si le fichier existe
        if os.path.exists(self.model_path):
            checkpoint = torch.load(self.model_path, map_location="cpu", weights_only=True)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            val_acc = checkpoint.get("best_val_acc", "?")
            f1 = checkpoint.get("best_val_f1_macro", "?")
            print(f"   [OK] Modele HAM10000 charge (val_acc={val_acc} | val_f1_macro={f1})")
        else:
            print("   [WARN] Modele HAM10000 non trouve - poids ImageNet par defaut")

        # Mode évaluation (pas d'entraînement)
        self.model.eval()

        # Temperature scaling (calibration de confiance) -- fallback T=1.0
        self.temperature, self.temperature_source = self._load_temperature()
        print(
            f"   [OK] Temperature = {self.temperature:.3f} (source: {self.temperature_source})"
        )

        # Seuil d'incertitude calibre (depuis evaluate.py) -- fallback 0.60
        self.uncertainty_threshold, self.threshold_source = self._load_uncertainty_threshold()
        print(
            f"   [OK] Seuil d'incertitude = {self.uncertainty_threshold:.2f} "
            f"(source: {self.threshold_source})"
        )

        # Pipeline de transformation d'image (obligatoire pour ResNet)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])

    def _load_uncertainty_threshold(self):
        """Lit best_uncertainty_threshold.threshold dans evaluation_report.json.
        Fallback : DEFAULT_UNCERTAINTY_THRESHOLD si fichier absent / invalide.
        Retourne (threshold, source).
        """
        try:
            with open(self.report_path, "r", encoding="utf-8") as f:
                report = json.load(f)
            thr_obj = report.get("best_uncertainty_threshold")
            if thr_obj and thr_obj.get("score", 0) > 0 and "threshold" in thr_obj:
                return float(thr_obj["threshold"]), "evaluation_report.json"
        except (FileNotFoundError, json.JSONDecodeError, KeyError, TypeError, ValueError):
            pass
        return DEFAULT_UNCERTAINTY_THRESHOLD, "default (no eval report)"

    def _load_temperature(self):
        """Lit la temperature depuis calibration.json. Fallback T=1.0.
        Retourne (temperature, source).
        """
        try:
            with open(self.calibration_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            t = float(data.get("temperature", 1.0))
            if t > 0:
                return t, "calibration.json"
        except (FileNotFoundError, json.JSONDecodeError, KeyError, TypeError, ValueError):
            pass
        return 1.0, "default (no calibration)"

    def predict(self, image_path: str) -> dict:
        """
        Analyse une image de lésion cutanée.

        Args:
            image_path: Chemin vers l'image à analyser.

        Returns:
            dict avec la prédiction, la confiance, le risque et les alternatives.
        """
        start_time = time.time()
        request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"

        # 1. Charger et transformer l'image
        img = Image.open(image_path).convert("RGB")
        img_tensor = self.transform(img)
        batch = torch.unsqueeze(img_tensor, 0)  # Ajouter la dimension batch

        # 2. Inférence (sans calculer les gradients = plus rapide)
        with torch.no_grad():
            logits = self.model(batch)

        # 3. Temperature scaling puis softmax (probabilites calibrees)
        probabilities = torch.nn.functional.softmax(logits[0] / self.temperature, dim=0)

        # 4. Trier par probabilité décroissante
        sorted_probs, sorted_indices = torch.sort(probabilities, descending=True)

        # 5. Extraire le diagnostic principal
        primary_label = self.CLASSES[sorted_indices[0].item()]
        primary_confidence = sorted_probs[0].item()
        primary_label_human = self.LABEL_MAP[primary_label]

        # 6. Extraire les alternatives (Top 3)
        alternatives = []
        for i in range(1, min(3, len(self.CLASSES))):
            label_code = self.CLASSES[sorted_indices[i].item()]
            alternatives.append({
                "label": self.LABEL_MAP.get(label_code, label_code),
                "score": round(sorted_probs[i].item(), 4),
            })

        # 7. Detection out-of-distribution (image hors du domaine d'entrainement)
        # Le modele a ete entraine sur 7 classes de lesions HAM10000 -- il n'a
        # pas de categorie "peau saine" ou "main entiere". Si on lui presente
        # une image hors de ce domaine, il est force de choisir une classe.
        # On le detecte via : confiance max faible OU entropie quasi-maximale.
        probs_list = probabilities.tolist()
        eps = 1e-10
        H = -sum(p * math.log(p + eps) for p in probs_list)
        H_max = math.log(len(self.CLASSES))
        entropy_normalized = H / H_max if H_max > 0 else 0.0

        is_out_of_distribution = (
            primary_confidence < OOD_MAX_PROB_THRESHOLD
            or entropy_normalized > OOD_ENTROPY_THRESHOLD
        )

        # 8. Déterminer si l'IA est incertaine
        # Force a True si OOD : meme une "confidence" elevee n'est pas fiable
        # quand l'image est hors domaine.
        is_uncertain = (
            primary_confidence < self.uncertainty_threshold
            or is_out_of_distribution
        )

        # 9. Calculer le temps de traitement
        latency = round(time.time() - start_time, 3)

        return {
            "request_id": request_id,
            "status": "success",
            "data": {
                "primary_diagnosis": primary_label_human,
                "confidence": round(primary_confidence, 4),
                "risk_level": self.RISK_MAP.get(primary_label, "UNKNOWN"),
                "is_uncertain": is_uncertain,
                "is_out_of_distribution": is_out_of_distribution,
                "entropy_normalized": round(entropy_normalized, 4),
                "alternatives": alternatives,
                "all_scores": {
                    self.CLASSES[i]: round(probabilities[i].item(), 4)
                    for i in range(len(self.CLASSES))
                },
                "metadata": {
                    "model_version": "AMANE-ResNet18-v1.0",
                    "latency_seconds": latency,
                    "image_processed": image_path,
                    "uncertainty_threshold": self.uncertainty_threshold,
                    "threshold_source": self.threshold_source,
                    "temperature": self.temperature,
                    "temperature_source": self.temperature_source,
                    "ood_max_prob_threshold": OOD_MAX_PROB_THRESHOLD,
                    "ood_entropy_threshold": OOD_ENTROPY_THRESHOLD,
                },
            },
        }


# Test rapide si exécuté directement
if __name__ == "__main__":
    classifier = AmaneClassifier()
    print("✅ Modèle AMANE chargé avec succès !")
    print(f"   Classes: {classifier.CLASSES}")
    print("   Prêt pour l'inférence.")
    # Pour tester avec une image :
    # result = classifier.predict("chemin/vers/image.jpg")
    # print(result)
