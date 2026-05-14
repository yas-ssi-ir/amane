"""
AMANE - Evaluation finale du modele sur le TEST SET fige.

A executer apres `python -m backend.ai.train`. Recharge le checkpoint et
calcule sur le set de TEST (jamais vu pendant l'entrainement) :
  - Accuracy globale
  - Precision / Recall / F1 par classe
  - Matrice de confusion
  - Distribution des scores de confiance (correct vs incorrect)
  - Seuil d'incertitude optimal (utilise par inference.py)
  - Sensibilite sur les classes critiques (melanome, BCC)

Usage :
   python -m backend.ai.evaluate
"""

import os
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

from backend.ai.train import (
    HAM10000Dataset,
    CLASSES,
    IMAGE_DIRS,
    MODEL_SAVE_PATH,
    BATCH_SIZE,
    val_transform,
    build_model,
    get_or_create_splits,
)


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "models", "evaluation_report.json")
CALIBRATION_PATH = os.path.join(os.path.dirname(__file__), "models", "calibration.json")


def load_temperature() -> tuple[float, str]:
    """Lit la temperature depuis calibration.json. Defaut 1.0 (pas de calibration).
    Retourne (T, source).
    """
    try:
        with open(CALIBRATION_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        t = float(data.get("temperature", 1.0))
        if t > 0:
            return t, "calibration.json"
    except (FileNotFoundError, json.JSONDecodeError, KeyError, TypeError, ValueError):
        pass
    return 1.0, "default (no calibration)"

LABEL_FR = {
    "mel": "Melanome",
    "nv": "Naevus",
    "bcc": "Carcinome basocellulaire",
    "akiec": "Keratose actinique",
    "bkl": "Keratose benigne",
    "df": "Dermatofibrome",
    "vasc": "Lesion vasculaire",
}


def predict_all(model, loader, temperature: float = 1.0):
    """Retourne (y_true, y_pred, all_probs) sur tout le loader.
    Applique le temperature scaling : softmax(logits / T).
    """
    model.eval()
    all_true, all_pred, all_probs = [], [], []
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(DEVICE)
            logits = model(images)
            probs = torch.softmax(logits / temperature, dim=1).cpu().numpy()
            preds = probs.argmax(axis=1)
            all_true.extend(labels.numpy().tolist())
            all_pred.extend(preds.tolist())
            all_probs.append(probs)
    return (
        np.array(all_true),
        np.array(all_pred),
        np.concatenate(all_probs, axis=0),
    )


def find_best_uncertainty_threshold(y_true, y_pred, probs, target_acc=0.90):
    """Cherche le seuil de confiance qui maximise la couverture sous contrainte
    accuracy_couverte >= target_acc.

    Renvoyer un seuil > 0.95 == le modele est tres incertain : on prefere envoyer
    plus de cas au medecin.
    """
    max_probs = probs.max(axis=1)
    correct = (y_true == y_pred)

    best = None
    for thr in np.arange(0.30, 0.96, 0.02):
        keep = max_probs >= thr
        if keep.sum() == 0:
            continue
        coverage = keep.mean()
        acc_covered = correct[keep].mean()
        score = coverage if acc_covered >= target_acc else 0
        if best is None or score > best["score"] or (
            score == best["score"] and acc_covered > best["acc_covered"]
        ):
            best = {
                "threshold": float(round(thr, 2)),
                "coverage": float(coverage),
                "acc_covered": float(acc_covered),
                "score": float(score),
                "target_acc": float(target_acc),
            }
    return best


def main():
    print("=" * 64)
    print("[AMANE] Evaluation finale (TEST SET fige)")
    print("=" * 64)
    print(f"   Device     : {DEVICE}")
    print(f"   Checkpoint : {MODEL_SAVE_PATH}")

    if not os.path.exists(MODEL_SAVE_PATH):
        print("\n[ERREUR] Checkpoint introuvable. Lance d'abord : python -m backend.ai.train")
        return

    # 1. Charger le checkpoint
    ckpt = torch.load(MODEL_SAVE_PATH, map_location=DEVICE, weights_only=False)
    model = build_model(pretrained=False)
    model.load_state_dict(ckpt["model_state_dict"])
    model = model.to(DEVICE)

    print(f"   Best val acc (train)     : {ckpt.get('best_val_acc', 'N/A')}")
    print(f"   Best val f1_macro (train): {ckpt.get('best_val_f1_macro', 'N/A')}")
    print(f"   Best epoch               : {ckpt.get('epoch', 'N/A')}")
    print(f"   Saved at                 : {ckpt.get('saved_at', 'N/A')}")

    # 2. Splits + verification de coherence
    train_df, val_df, test_df, split_hash = get_or_create_splits()
    ckpt_hash = ckpt.get("split_hash")

    print(f"\n   Split hash actuel  : {split_hash}")
    print(f"   Split hash ckpt    : {ckpt_hash}")

    if ckpt_hash != split_hash:
        print("\n   [WARN] Le split du checkpoint ne correspond PAS au split actuel.")
        print("          L'evaluation peut etre biaisee (data leakage).")
        print("          Recommandation : supprimer le checkpoint et relancer train.")

    print(f"\n   Taille TEST : {len(test_df)} images")

    # 3. DataLoader test
    test_dataset = HAM10000Dataset(test_df, IMAGE_DIRS, val_transform)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # 4. Charger T (temperature scaling) et inference sur TEST
    temperature, t_source = load_temperature()
    print(f"\n   Temperature scaling : T={temperature:.4f} (source: {t_source})")

    print("\n>> Inference sur TEST SET...")
    y_true, y_pred, probs = predict_all(model, test_loader, temperature=temperature)

    # 5. Metriques globales
    accuracy = (y_true == y_pred).mean()
    print(f"\n>> Accuracy TEST : {accuracy * 100:.2f}%")

    # 6. Per-class
    print("\n" + "-" * 64)
    print("PRECISION / RECALL / F1 PAR CLASSE (TEST)")
    print("-" * 64)
    report = classification_report(
        y_true, y_pred,
        labels=list(range(len(CLASSES))),
        target_names=CLASSES,
        digits=3,
        zero_division=0,
    )
    print(report)

    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred,
        labels=list(range(len(CLASSES))),
        zero_division=0,
    )
    f1_macro = float(np.mean(f1))

    per_class = []
    for i, cls in enumerate(CLASSES):
        per_class.append({
            "code": cls,
            "label": LABEL_FR[cls],
            "support": int(support[i]),
            "precision": float(round(precision[i], 4)),
            "recall": float(round(recall[i], 4)),
            "f1": float(round(f1[i], 4)),
        })

    # 7. Confusion matrix
    print("\n" + "-" * 64)
    print("MATRICE DE CONFUSION (lignes = verite, colonnes = prediction)")
    print("-" * 64)
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(CLASSES))))
    header = "       " + "  ".join(f"{c:>5}" for c in CLASSES)
    print(header)
    for i, cls in enumerate(CLASSES):
        row = f"{cls:>5}  " + "  ".join(f"{cm[i][j]:>5}" for j in range(len(CLASSES)))
        print(row)

    # 8. Confiance correct vs incorrect
    max_probs = probs.max(axis=1)
    correct_mask = (y_true == y_pred)
    print("\n" + "-" * 64)
    print("ANALYSE DES CONFIANCES (softmax max)")
    print("-" * 64)
    mean_correct = max_probs[correct_mask].mean() if correct_mask.any() else 0
    mean_incorrect = max_probs[~correct_mask].mean() if (~correct_mask).any() else 0
    print(f"   Confiance moyenne (correct)   : {mean_correct:.3f}")
    print(f"   Confiance moyenne (incorrect) : {mean_incorrect:.3f}")
    print(f"   Ecart                         : {(mean_correct - mean_incorrect):.3f}")

    # 9. Seuil optimal
    best_thr = find_best_uncertainty_threshold(y_true, y_pred, probs, target_acc=0.90)
    print("\n" + "-" * 64)
    print("SEUIL D'INCERTITUDE RECOMMANDE (pour inference.py)")
    print("-" * 64)
    if best_thr and best_thr["score"] > 0:
        print(f"   Seuil optimal       : {best_thr['threshold']:.2f}")
        print(f"   Couverture          : {best_thr['coverage'] * 100:.1f}% des cas")
        print(f"   Accuracy si couvert : {best_thr['acc_covered'] * 100:.1f}%")
        print(f"   (cas sous le seuil  -> renvoyes au medecin avec is_uncertain=True)")
    else:
        print("   Aucun seuil ne garantit >=90% d'accuracy. Le modele doit etre ameliore.")

    # 10. Classes critiques (faux negatifs dangereux)
    print("\n" + "-" * 64)
    print("CLASSES CRITIQUES (sensibilite = 1 - taux de faux negatifs)")
    print("-" * 64)
    for crit_code, crit_name in [("mel", "Melanome"), ("bcc", "Carcinome basocellulaire")]:
        crit_idx = CLASSES.index(crit_code)
        true_mask = (y_true == crit_idx)
        n_total = int(true_mask.sum())
        if n_total == 0:
            continue
        n_caught = int((y_pred[true_mask] == crit_idx).sum())
        n_missed = n_total - n_caught
        sens = n_caught / n_total
        print(f"   {crit_name:>30} : {n_caught}/{n_total} detectes "
              f"({sens * 100:.1f}% sensibilite) - {n_missed} manques")

    # 11. Sauvegarde
    summary = {
        "checkpoint": MODEL_SAVE_PATH,
        "split_hash": split_hash,
        "ckpt_split_hash": ckpt_hash,
        "split_consistent": (ckpt_hash == split_hash),
        "best_val_acc_train": float(ckpt.get("best_val_acc", 0)),
        "best_val_f1_macro_train": float(ckpt.get("best_val_f1_macro", 0)),
        "epoch": int(ckpt.get("epoch", 0)),
        "eval_set": "test",
        "eval_size": int(len(test_df)),
        "temperature": temperature,
        "temperature_source": t_source,
        "global_accuracy": float(round(accuracy, 4)),
        "global_f1_macro": float(round(f1_macro, 4)),
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "classes": CLASSES,
        "confidence_correct_mean": float(round(mean_correct, 4)),
        "confidence_incorrect_mean": float(round(mean_incorrect, 4)),
        "best_uncertainty_threshold": best_thr,
    }
    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\n>> Rapport JSON sauvegarde : {RESULTS_PATH}")
    print("   inference.py lira automatiquement 'best_uncertainty_threshold' au demarrage.")
    print("=" * 64)


if __name__ == "__main__":
    main()
