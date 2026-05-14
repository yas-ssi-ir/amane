"""
AMANE - Module d'Explicabilité (Grad-CAM)
Génère des heatmaps visuelles montrant POURQUOI l'IA a pris sa décision.
C'est l'argument clé de l'"Infrastructure de Confiance".

Rouge = Zone très importante pour la décision de l'IA
Bleu  = Zone ignorée par l'IA
"""

import torch
import numpy as np
import cv2
from PIL import Image
from torchvision import transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
import os
import uuid


class AmaneExplainer:
    """
    Génère des heatmaps Grad-CAM pour expliquer les prédictions.
    Permet au médecin de voir exactement ce que l'IA a "regardé".
    """

    def __init__(self, model):
        """
        Args:
            model: Le modèle ResNet18 chargé depuis AmaneClassifier.
        """
        self.model = model

        # On cible la dernière couche convolutionnelle (layer4)
        # C'est là que le modèle "comprend" les formes complexes
        self.target_layer = [self.model.layer4[-1]]

        # Pipeline de transformation — doit être identique à inference.py
        # pour que la heatmap corresponde aux mêmes pixels que la prédiction.
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])

        # Dossier de sortie pour les heatmaps
        self.output_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "uploads", "heatmaps"
        )
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_heatmap(self, image_path: str, target_class: int = None) -> dict:
        """
        Génère une heatmap Grad-CAM pour une image donnée.

        Args:
            image_path: Chemin vers l'image originale.
            target_class: Classe cible (si None, utilise la classe prédite).

        Returns:
            dict avec le chemin de la heatmap et les métadonnées.
        """
        # 1. Charger l'image originale (pour l'overlay)
        original_img = Image.open(image_path).convert("RGB")
        original_img_resized = original_img.resize((224, 224))
        rgb_img = np.array(original_img_resized) / 255.0  # Normaliser entre 0 et 1

        # 2. Transformer l'image pour le modèle
        img_tensor = self.transform(original_img)
        input_batch = torch.unsqueeze(img_tensor, 0)

        # 3. Créer l'objet Grad-CAM
        cam = GradCAM(model=self.model, target_layers=self.target_layer)

        # 4. Générer la heatmap
        # Si target_class est None, Grad-CAM utilise la classe prédite
        targets = None
        if target_class is not None:
            from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
            targets = [ClassifierOutputTarget(target_class)]

        grayscale_cam = cam(input_tensor=input_batch, targets=targets)
        grayscale_cam = grayscale_cam[0, :]  # Première image du batch

        # 5. Superposer la heatmap sur l'image originale
        heatmap_overlay = show_cam_on_image(
            rgb_img.astype(np.float32),
            grayscale_cam,
            use_rgb=True
        )

        # 6. Sauvegarder la heatmap
        heatmap_id = f"heatmap_{uuid.uuid4().hex[:8]}"
        heatmap_filename = f"{heatmap_id}.jpg"
        heatmap_path = os.path.join(self.output_dir, heatmap_filename)

        # Convertir RGB → BGR pour OpenCV, puis sauvegarder
        heatmap_bgr = cv2.cvtColor(heatmap_overlay, cv2.COLOR_RGB2BGR)
        cv2.imwrite(heatmap_path, heatmap_bgr)

        # 7. Trouver la zone la plus "chaude" (bounding box)
        # On cherche le rectangle qui contient le plus de rouge
        threshold = 0.5
        binary_mask = (grayscale_cam > threshold).astype(np.uint8)
        contours, _ = cv2.findContours(
            binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        bounding_box = None
        if contours:
            # Prendre le plus grand contour
            largest_contour = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(largest_contour)
            bounding_box = {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}

        return {
            "heatmap_path": heatmap_path,
            "heatmap_filename": heatmap_filename,
            "bounding_box": bounding_box,
            "max_activation": float(np.max(grayscale_cam)),
            "mean_activation": float(np.mean(grayscale_cam)),
        }


# Test rapide
if __name__ == "__main__":
    from inference import AmaneClassifier

    classifier = AmaneClassifier()
    explainer = AmaneExplainer(classifier.model)
    print("✅ Module d'explicabilité Grad-CAM chargé !")
    print(f"   Heatmaps seront sauvegardées dans : {explainer.output_dir}")
    # Pour tester :
    # result = explainer.generate_heatmap("chemin/vers/image.jpg")
    # print(result)
