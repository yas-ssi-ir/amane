"""
AMANE - Calibration de confiance par Temperature Scaling (Guo et al. 2017).

Le softmax d'un reseau profond surestime systematiquement la confiance
(une prediction "0.95" n'est generalement pas correcte 95% du temps).
On apprend un scalaire T sur le SET DE VALIDATION qui rescale les logits :
    proba_calibree = softmax(logits / T)

T > 1  -> modele surconfiant, on adoucit (cas typique)
T = 1  -> deja calibre
T < 1  -> sous-confiant (rare)

Pipeline :
    1. python -m backend.ai.train       -> checkpoint
    2. python -m backend.ai.calibrate   -> calibration.json (T)
    3. python -m backend.ai.evaluate    -> evaluation_report.json (avec T)
    4. Redemarrer uvicorn               -> inference.py applique T

Usage : python -m backend.ai.calibrate
"""

import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

from backend.ai.train import (
    HAM10000Dataset,
    IMAGE_DIRS,
    MODEL_SAVE_PATH,
    BATCH_SIZE,
    val_transform,
    build_model,
    get_or_create_splits,
)


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CALIBRATION_PATH = os.path.join(os.path.dirname(__file__), "models", "calibration.json")


def collect_logits(model, loader):
    """Inference sur tout le loader, retourne (logits, labels) sur CPU."""
    model.eval()
    all_logits, all_labels = [], []
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(DEVICE)
            logits = model(images)
            all_logits.append(logits.cpu())
            all_labels.append(labels)
    return torch.cat(all_logits), torch.cat(all_labels)


def expected_calibration_error(probs, labels, n_bins=15):
    """ECE = sum_b |bin_acc - bin_confidence| * bin_weight.

    0 = parfaitement calibre. ~0.05 = bien. > 0.10 = mal calibre.
    """
    confidences, predictions = probs.max(dim=1)
    accuracies = predictions.eq(labels).float()
    ece = 0.0
    bin_boundaries = torch.linspace(0, 1, n_bins + 1)
    for i in range(n_bins):
        lo, hi = bin_boundaries[i], bin_boundaries[i + 1]
        in_bin = (confidences > lo) & (confidences <= hi)
        prop = in_bin.float().mean().item()
        if prop > 0:
            acc_in = accuracies[in_bin].mean().item()
            conf_in = confidences[in_bin].mean().item()
            ece += prop * abs(acc_in - conf_in)
    return ece


def optimize_temperature(logits, labels, max_iter=100):
    """Optimise T scalaire avec LBFGS pour minimiser NLL(softmax(logits/T), labels)."""
    T = nn.Parameter(torch.ones(1) * 1.5)
    nll = nn.CrossEntropyLoss()
    optimizer = optim.LBFGS([T], lr=0.01, max_iter=max_iter)

    def closure():
        optimizer.zero_grad()
        loss = nll(logits / T, labels)
        loss.backward()
        return loss

    optimizer.step(closure)
    return float(T.detach().clamp(min=0.05).item())


def main():
    print("=" * 64)
    print("[AMANE] Calibration par Temperature Scaling")
    print("=" * 64)
    print(f"   Device     : {DEVICE}")
    print(f"   Checkpoint : {MODEL_SAVE_PATH}")

    if not os.path.exists(MODEL_SAVE_PATH):
        print("\n[ERREUR] Checkpoint introuvable. Lance d'abord : python -m backend.ai.train")
        return

    # 1. Modele
    ckpt = torch.load(MODEL_SAVE_PATH, map_location=DEVICE, weights_only=False)
    model = build_model(pretrained=False)
    model.load_state_dict(ckpt["model_state_dict"])
    model = model.to(DEVICE)

    # 2. Set de VALIDATION (pas test - on prefere garder test intouche)
    train_df, val_df, test_df, split_hash = get_or_create_splits()
    print(f"   Split hash : {split_hash}")
    print(f"   Val size   : {len(val_df)}")

    val_dataset = HAM10000Dataset(val_df, IMAGE_DIRS, val_transform)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # 3. Collecte des logits
    print("\n>> Collection des logits sur le set de validation...")
    logits, labels = collect_logits(model, val_loader)

    # 4. Metriques avant
    probs_before = torch.softmax(logits, dim=1)
    nll_before = float(nn.CrossEntropyLoss()(logits, labels).item())
    ece_before = expected_calibration_error(probs_before, labels)

    print("\n" + "-" * 64)
    print("AVANT CALIBRATION")
    print("-" * 64)
    print(f"   NLL : {nll_before:.4f}")
    print(f"   ECE : {ece_before:.4f}")

    # 5. Optimisation
    print("\n>> Optimisation de T (LBFGS sur NLL)...")
    T_opt = optimize_temperature(logits, labels)

    # 6. Metriques apres
    logits_cal = logits / T_opt
    probs_after = torch.softmax(logits_cal, dim=1)
    nll_after = float(nn.CrossEntropyLoss()(logits_cal, labels).item())
    ece_after = expected_calibration_error(probs_after, labels)

    print("\n" + "-" * 64)
    print("APRES CALIBRATION")
    print("-" * 64)
    print(f"   T optimise : {T_opt:.4f}")
    print(f"   NLL        : {nll_after:.4f}  (delta : {nll_after - nll_before:+.4f})")
    print(f"   ECE        : {ece_after:.4f}  (delta : {ece_after - ece_before:+.4f})")

    # Interpretation
    print()
    if abs(T_opt - 1.0) < 0.05:
        print("   -> T proche de 1 : le modele etait deja bien calibre.")
    elif T_opt > 1.0:
        print(f"   -> T={T_opt:.2f} > 1 : le modele etait surconfiant (typique). On adoucit.")
        print("      Les confidences vont baisser, surtout pour les bonnes predictions.")
    else:
        print(f"   -> T={T_opt:.2f} < 1 : le modele etait sous-confiant (rare). On rehausse.")

    # 7. Sauvegarde
    payload = {
        "temperature": T_opt,
        "split_hash": split_hash,
        "ckpt_split_hash": ckpt.get("split_hash"),
        "val_size": int(len(val_df)),
        "metrics_before": {
            "nll": nll_before,
            "ece": ece_before,
        },
        "metrics_after": {
            "nll": nll_after,
            "ece": ece_after,
        },
    }
    os.makedirs(os.path.dirname(CALIBRATION_PATH), exist_ok=True)
    with open(CALIBRATION_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"\n>> Calibration sauvegardee : {CALIBRATION_PATH}")
    print("\n   Etape suivante : python -m backend.ai.evaluate")
    print("   (recalcule le seuil d'incertitude sur les probas calibrees)")
    print("=" * 64)


if __name__ == "__main__":
    main()
