"""
AMANE - Script d'entrainement (Fine-Tuning ResNet18 sur HAM10000)

Methodologie pro :
  - Split stratifie 70/15/15 (train / val / test) fige dans splits.json
    -> le test set n'est JAMAIS vu pendant l'entrainement
  - WeightedRandomSampler pour compenser le desequilibre de classes
  - Selection du meilleur modele sur F1-macro de val (pas accuracy : trompeur si desequilibre)
  - Early stopping (patience configurable)
  - Historique complet par epoch sauvegarde dans training_history.json
  - Reprise auto si checkpoint compatible (split_hash identique)
  - Refus de reprendre si split_hash different (evite le data leakage)

Usage :
   python -m backend.ai.train
"""

import os
import json
import time
import hashlib
from collections import Counter
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import models, transforms
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, precision_recall_fscore_support


# ============================================
# Configuration
# ============================================
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
METADATA_PATH = os.path.join(DATA_DIR, "HAM10000_metadata.csv")
IMAGE_DIRS = [
    os.path.join(DATA_DIR, "HAM10000_images_part_1"),
    os.path.join(DATA_DIR, "HAM10000_images_part_2"),
]

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_SAVE_PATH = os.path.join(MODELS_DIR, "amane_skin_v1.pth")
SPLITS_PATH = os.path.join(MODELS_DIR, "splits.json")
HISTORY_PATH = os.path.join(MODELS_DIR, "training_history.json")
os.makedirs(MODELS_DIR, exist_ok=True)

# Hyperparametres
BATCH_SIZE = 32
NUM_EPOCHS = 50                # max - early stopping arretera avant
LEARNING_RATE = 0.001
IMAGE_SIZE = 224
SEED = 42
EARLY_STOP_PATIENCE = 5        # nb d'epochs sans amelioration avant arret
EARLY_STOP_MIN_DELTA = 0.001   # delta minimum pour considerer une amelioration
MONITOR_METRIC = "val_f1_macro"  # metrique a optimiser (mieux que accuracy si desequilibre)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Les 7 classes du HAM10000
CLASSES = ["mel", "nv", "bcc", "akiec", "bkl", "df", "vasc"]
CLASS_TO_IDX = {cls: idx for idx, cls in enumerate(CLASSES)}


# ============================================
# Dataset
# ============================================
class HAM10000Dataset(Dataset):
    def __init__(self, dataframe, image_dirs, transform=None):
        self.df = dataframe.reset_index(drop=True)
        self.image_dirs = image_dirs
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def _find_image(self, image_id):
        for img_dir in self.image_dirs:
            path = os.path.join(img_dir, f"{image_id}.jpg")
            if os.path.exists(path):
                return path
        return None

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        image_id = row["image_id"]
        label = CLASS_TO_IDX[row["dx"]]

        img_path = self._find_image(image_id)
        if img_path is None:
            raise FileNotFoundError(f"Image {image_id}.jpg introuvable")

        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)

        return image, label


# ============================================
# Transformations
# ============================================
train_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

val_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


# ============================================
# Splits stratifies (70/15/15) - figes
# ============================================
def _compute_split_hash(train_ids, val_ids, test_ids):
    h = hashlib.sha256()
    for ids in (sorted(train_ids), sorted(val_ids), sorted(test_ids)):
        h.update("|".join(ids).encode("utf-8"))
        h.update(b"###")
    return h.hexdigest()[:16]


def get_or_create_splits():
    """Charge splits.json si existe, sinon cree un split stratifie 70/15/15
    deterministe (seed=42) et le sauvegarde.

    Retourne (train_df, val_df, test_df, split_hash).
    """
    if not os.path.exists(METADATA_PATH):
        raise FileNotFoundError(f"Metadata introuvable : {METADATA_PATH}")

    df = pd.read_csv(METADATA_PATH)

    if os.path.exists(SPLITS_PATH):
        with open(SPLITS_PATH, "r", encoding="utf-8") as f:
            splits = json.load(f)
        train_df = df[df["image_id"].isin(splits["train"])].reset_index(drop=True)
        val_df = df[df["image_id"].isin(splits["val"])].reset_index(drop=True)
        test_df = df[df["image_id"].isin(splits["test"])].reset_index(drop=True)
        return train_df, val_df, test_df, splits["split_hash"]

    # Premier run : on cree le split
    # 70 / 15 / 15 stratifie : on extrait d'abord 30%, puis on coupe en deux
    train_df, temp_df = train_test_split(
        df, test_size=0.30, stratify=df["dx"], random_state=SEED
    )
    val_df, test_df = train_test_split(
        temp_df, test_size=0.50, stratify=temp_df["dx"], random_state=SEED
    )

    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    split_hash = _compute_split_hash(
        train_df["image_id"].tolist(),
        val_df["image_id"].tolist(),
        test_df["image_id"].tolist(),
    )

    payload = {
        "seed": SEED,
        "test_size": 0.15,
        "val_size": 0.15,
        "split_hash": split_hash,
        "n_train": len(train_df),
        "n_val": len(val_df),
        "n_test": len(test_df),
        "class_distribution": {
            "train": dict(Counter(train_df["dx"])),
            "val": dict(Counter(val_df["dx"])),
            "test": dict(Counter(test_df["dx"])),
        },
        "train": train_df["image_id"].tolist(),
        "val": val_df["image_id"].tolist(),
        "test": test_df["image_id"].tolist(),
    }
    with open(SPLITS_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    return train_df, val_df, test_df, split_hash


# ============================================
# Modele
# ============================================
def build_model(pretrained=True):
    weights = models.ResNet18_Weights.DEFAULT if pretrained else None
    model = models.resnet18(weights=weights)
    # Geler tout
    for param in model.parameters():
        param.requires_grad = False
    # Degeler layer4 pour fine-tuning
    for param in model.layer4.parameters():
        param.requires_grad = True
    # Tete de classification custom (7 classes)
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_features, 256),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(256, len(CLASSES)),
    )
    return model


# ============================================
# Evaluation (utilisee pour val ET test)
# ============================================
def evaluate_model(model, loader, criterion):
    """Retourne loss + accuracy + f1_macro + metriques par classe."""
    model.eval()
    all_true, all_pred = [], []
    total_loss = 0.0
    n_batches = 0

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            n_batches += 1
            _, predicted = torch.max(outputs, 1)
            all_true.extend(labels.cpu().numpy().tolist())
            all_pred.extend(predicted.cpu().numpy().tolist())

    all_true = np.array(all_true)
    all_pred = np.array(all_pred)
    acc = (all_true == all_pred).mean() * 100 if len(all_true) else 0.0
    f1_macro = f1_score(
        all_true, all_pred,
        labels=list(range(len(CLASSES))),
        average="macro", zero_division=0,
    )
    precision, recall, f1, _ = precision_recall_fscore_support(
        all_true, all_pred,
        labels=list(range(len(CLASSES))),
        zero_division=0,
    )
    return {
        "loss": total_loss / max(n_batches, 1),
        "acc": float(acc),
        "f1_macro": float(f1_macro),
        "per_class_f1": {CLASSES[i]: float(round(f1[i], 4)) for i in range(len(CLASSES))},
        "per_class_precision": {CLASSES[i]: float(round(precision[i], 4)) for i in range(len(CLASSES))},
        "per_class_recall": {CLASSES[i]: float(round(recall[i], 4)) for i in range(len(CLASSES))},
    }


# ============================================
# Entrainement
# ============================================
def train():
    print("=" * 64)
    print("[AMANE] Entrainement du modele de diagnostic cutane")
    print("=" * 64)
    print(f"   Device         : {DEVICE}")
    print(f"   Dataset        : {DATA_DIR}")
    print(f"   Monitor metric : {MONITOR_METRIC}")
    print(f"   Patience       : {EARLY_STOP_PATIENCE} epochs")
    print(f"   Max epochs     : {NUM_EPOCHS}")

    # Repro
    torch.manual_seed(SEED)
    np.random.seed(SEED)

    # 1. Splits stratifies 70/15/15
    print("\n>> Chargement / creation du split...")
    train_df, val_df, test_df, split_hash = get_or_create_splits()
    print(f"   Split hash : {split_hash}")
    print(f"   Train : {len(train_df):>5}  |  Val : {len(val_df):>5}  |  Test : {len(test_df):>5}")
    print(f"   (Test set fige -> JAMAIS vu pendant l'entrainement)")

    # Distribution train
    counts_train = Counter(train_df["dx"])
    print("   Distribution train :")
    for cls in CLASSES:
        n = counts_train.get(cls, 0)
        pct = n / len(train_df) * 100 if len(train_df) else 0
        print(f"     {cls:>6} : {n:>5} ({pct:>5.1f}%)")

    # 2. WeightedRandomSampler (compense le desequilibre)
    class_weights = {cls: 1.0 / count for cls, count in counts_train.items()}
    sample_weights = [class_weights[row["dx"]] for _, row in train_df.iterrows()]
    sampler = WeightedRandomSampler(sample_weights, len(sample_weights))

    # 3. DataLoaders
    train_dataset = HAM10000Dataset(train_df, IMAGE_DIRS, train_transform)
    val_dataset = HAM10000Dataset(val_df, IMAGE_DIRS, val_transform)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=sampler, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # 4. Modele
    print("\n>> Configuration du modele (ResNet18, fine-tuning layer4 + tete)...")
    model = build_model(pretrained=True)

    # 5. Reprise si checkpoint compatible
    start_epoch = 0
    best_metric = -1.0
    history = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "split_hash": split_hash,
        "monitor": MONITOR_METRIC,
        "patience": EARLY_STOP_PATIENCE,
        "max_epochs": NUM_EPOCHS,
        "lr": LEARNING_RATE,
        "batch_size": BATCH_SIZE,
        "device": str(DEVICE),
        "epochs": [],
        "best_epoch": None,
        "best_metric": None,
        "stopped_early_at": None,
    }

    if os.path.exists(MODEL_SAVE_PATH):
        ckpt = torch.load(MODEL_SAVE_PATH, map_location=DEVICE, weights_only=False)
        ckpt_split = ckpt.get("split_hash")
        if ckpt_split == split_hash:
            print(f"   [RESUME] Checkpoint compatible (split_hash={ckpt_split[:8]}...) -> reprise")
            model.load_state_dict(ckpt["model_state_dict"])
            best_metric = ckpt.get("best_val_f1_macro", -1.0)
            start_epoch = ckpt.get("epoch", 0)
            print(f"   Reprise epoch {start_epoch + 1} | best {MONITOR_METRIC}={best_metric:.4f}")
            if os.path.exists(HISTORY_PATH):
                try:
                    with open(HISTORY_PATH, "r", encoding="utf-8") as f:
                        history = json.load(f)
                except (json.JSONDecodeError, OSError):
                    pass
        else:
            print(f"   [WARN] Checkpoint existant trouve mais split different :")
            print(f"          ckpt={ckpt_split}  vs  current={split_hash}")
            print(f"          -> Ignore (eviter le data leakage). Entrainement from scratch.")
    else:
        print("   [NEW] Pas de checkpoint -> entrainement from scratch.")

    model = model.to(DEVICE)

    # 6. Loss + optimizer + scheduler
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LEARNING_RATE,
    )
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)

    # 7. Boucle entrainement
    print(f"\n>> Debut entrainement (max {NUM_EPOCHS} epochs, early stop patience={EARLY_STOP_PATIENCE})")
    print("-" * 64)

    epochs_without_improvement = 0

    for epoch in range(start_epoch, NUM_EPOCHS):
        start_time = time.time()

        # --- TRAIN ---
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()

            if (batch_idx + 1) % 50 == 0:
                print(f"   Batch {batch_idx+1}/{len(train_loader)} - loss={loss.item():.4f}")

        train_acc = train_correct / max(train_total, 1) * 100
        train_loss_avg = train_loss / max(len(train_loader), 1)

        # --- VAL ---
        val_metrics = evaluate_model(model, val_loader, criterion)

        epoch_time = time.time() - start_time
        current_metric = val_metrics["f1_macro"]
        lr_now = optimizer.param_groups[0]["lr"]

        epoch_record = {
            "epoch": epoch + 1,
            "train_loss": round(train_loss_avg, 4),
            "train_acc": round(train_acc, 2),
            "val_loss": round(val_metrics["loss"], 4),
            "val_acc": round(val_metrics["acc"], 2),
            "val_f1_macro": round(val_metrics["f1_macro"], 4),
            "val_per_class_f1": val_metrics["per_class_f1"],
            "lr": float(lr_now),
            "elapsed_s": round(epoch_time, 1),
        }
        history["epochs"].append(epoch_record)

        f1_mel = val_metrics["per_class_f1"].get("mel", 0)
        print(
            f"   Epoch [{epoch+1:>2}/{NUM_EPOCHS}] "
            f"| train_acc={train_acc:5.1f}% "
            f"| val_acc={val_metrics['acc']:5.1f}% "
            f"| val_f1_macro={val_metrics['f1_macro']:.3f} "
            f"| f1(mel)={f1_mel:.3f} "
            f"| lr={lr_now:.5f} "
            f"| t={epoch_time:.1f}s"
        )

        # Early stopping + save best
        improved = current_metric > best_metric + EARLY_STOP_MIN_DELTA
        if improved:
            best_metric = current_metric
            history["best_epoch"] = epoch + 1
            history["best_metric"] = round(best_metric, 4)
            epochs_without_improvement = 0
            torch.save({
                "model_state_dict": model.state_dict(),
                "classes": CLASSES,
                "best_val_acc": val_metrics["acc"],
                "best_val_f1_macro": val_metrics["f1_macro"],
                "per_class_f1": val_metrics["per_class_f1"],
                "per_class_precision": val_metrics["per_class_precision"],
                "per_class_recall": val_metrics["per_class_recall"],
                "epoch": epoch + 1,
                "split_hash": split_hash,
                "saved_at": datetime.now(timezone.utc).isoformat(),
            }, MODEL_SAVE_PATH)
            print(f"   [SAVE] Nouveau meilleur {MONITOR_METRIC}={best_metric:.4f} (epoch {epoch+1})")
        else:
            epochs_without_improvement += 1
            print(
                f"   (pas d'amelioration depuis {epochs_without_improvement}/{EARLY_STOP_PATIENCE} epoch(s) "
                f"- best={best_metric:.4f})"
            )

        # Sauvegarde de l'historique a chaque epoch (resilience aux crashes)
        with open(HISTORY_PATH, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)

        scheduler.step()

        # Early stopping ?
        if epochs_without_improvement >= EARLY_STOP_PATIENCE:
            history["stopped_early_at"] = epoch + 1
            with open(HISTORY_PATH, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2)
            print(f"\n   [STOP] Early stopping (pas d'amelioration depuis {EARLY_STOP_PATIENCE} epochs)")
            break

    print("\n" + "=" * 64)
    print(f"[DONE] Entrainement termine.")
    print(f"   Meilleur {MONITOR_METRIC} : {best_metric:.4f}")
    print(f"   Best epoch              : {history['best_epoch']}")
    print(f"   Modele sauvegarde       : {MODEL_SAVE_PATH}")
    print(f"   Historique              : {HISTORY_PATH}")
    print(f"   Splits                  : {SPLITS_PATH}")
    print(f"\n   Etape suivante : python -m backend.ai.evaluate")
    print("=" * 64)


if __name__ == "__main__":
    train()
