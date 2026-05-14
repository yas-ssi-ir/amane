"""
AMANE - Seed de demo pour MIATHON.

Cree :
  - 1 admin
  - 2 medecins
  - 2 relais (regions differentes)
  - 1 infirmier
  - Plusieurs consultations exemples (avec images du dataset HAM10000)
    * 1 melanome haute confiance (effet "wow")
    * 2 naevus tres confiants (l'IA fait le tri)
    * 1 cas incertain envoye au medecin
    * 1 BCC (carcinome basocellulaire)
    * 1 cas reviewe avec desaccord medecin/IA (montre la valeur humaine)
    * 1 urgence escaladee

Usage :
  python -m backend.seed
  python -m backend.seed --reset    # supprime tout d'abord (DEV ONLY)

Pre-requis :
  - Backend NON en train de tourner (sinon DB lock SQLite)
  - Modele entraine et calibre (amane_skin_v1.pth + calibration.json)
  - Images HAM10000 disponibles dans data/HAM10000_images_part_1/
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
import uuid
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import (
    AuditLog,
    Consultation,
    ConsultationStatus,
    MedecinDecision,
    MedecinReview,
    Patient,
    SessionLocal,
    User,
    create_tables,
    ensure_columns,
    ensure_indexes,
)

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
NOW = datetime.now(timezone.utc).replace(tzinfo=None)

# Chemins
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
HAM_PART1 = os.path.join(DATA_DIR, "HAM10000_images_part_1")
HAM_PART2 = os.path.join(DATA_DIR, "HAM10000_images_part_2")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
HEATMAP_DIR = os.path.join(UPLOAD_DIR, "heatmaps")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HEATMAP_DIR, exist_ok=True)


# ==================== USERS ====================
USERS = [
    {
        "username": "admin1",
        "password": "admin1234",
        "full_name": "Sara Bensouda",
        "role": "admin",
        "region": "Rabat-Sale-Kenitra",
        "verification_status": "not_required",
    },
    {
        "username": "medecin1",
        "password": "medecin123",
        "full_name": "Dr Said El Amrani",
        "role": "medecin",
        "speciality": "Dermatologie",
        "region": "Casablanca-Settat",
        "credential_number": "CNOM-2019-CAS-0472",
        "verification_status": "approved",
    },
    {
        "username": "medecin2",
        "password": "medecin123",
        "full_name": "Dr Yasmine Bennani",
        "role": "medecin",
        "speciality": "Dermatologie",
        "region": "Rabat-Sale-Kenitra",
        "credential_number": "CNOM-2021-RAB-0831",
        "verification_status": "approved",
    },
    {
        "username": "relais1",
        "password": "relais123",
        "full_name": "Ali Tazi",
        "role": "relais",
        "region": "Oriental",
        "verification_status": "not_required",
    },
    {
        "username": "relais2",
        "password": "relais123",
        "full_name": "Khadija Lahlou",
        "role": "relais",
        "region": "Draa-Tafilalet",
        "verification_status": "not_required",
    },
    {
        "username": "infirmier1",
        "password": "infirmier123",
        "full_name": "Mohammed El Fassi",
        "role": "infirmier",
        "region": "Beni Mellal-Khenifra",
        "credential_number": "ONIP-2022-BM-1139",
        "verification_status": "approved",
    },
    # Compte demo "en attente" pour montrer le workflow de vérification
    {
        "username": "medecin_new",
        "password": "medecin123",
        "full_name": "Dr Nadia Ouazzani",
        "role": "medecin",
        "speciality": "Médecine générale",
        "region": "Fes-Meknes",
        "credential_number": "CNOM-2024-FES-0012",
        "verification_status": "pending",
    },
]


# ==================== CONSULTATIONS ====================
# Chaque entrée :
#   - patient + cliniques
#   - image_id HAM10000 (sera copiee dans uploads/)
#   - resultat IA (sera "joué" sans appeler le modele)
#   - eventuel review medecin
CONSULTATIONS = [
    # --- 1. Mélanome haute confiance ---
    {
        "image_id": "ISIC_0024311",
        "region": "Casablanca-Settat",
        "age_range": "60-75",
        "gender": "M",
        "body_area": "Dos",
        "duration": "Plus de 6 mois",
        "symptoms": "Tâche brune asymétrique qui s'agrandit depuis 8 mois, contours irréguliers, plusieurs nuances de couleur.",
        "ai_prediction": "Mélanome",
        "ai_confidence": 0.91,
        "ai_risk_level": "CRITICAL",
        "ai_is_ood": False,
        "ai_is_uncertain": False,
        "alternatives": [
            {"label": "Naevus mélanocytaire", "score": 0.06},
            {"label": "Kératose bénigne", "score": 0.02},
        ],
        "gemini_description": "Lésion pigmentée asymétrique avec bords flous et plusieurs teintes de brun et noir.",
        "gemini_assessment": "suspicious",
        "gemini_concerns": ["Asymétrie marquée", "Bords irréguliers", "Plusieurs couleurs", "Diamètre apparent >6mm"],
        "gemini_action": "Consultation dermatologique urgente recommandée.",
        "relais": "relais1",
        "review": {
            "medecin": "medecin1",
            "decision": MedecinDecision.URGENCE,
            "agrees": True,
            "notes": "Confirme le mélanome. Patient à orienter immédiatement vers le service d'oncologie de Casablanca. Biopsie sous 48h.",
            "prescription": "Référencement urgent CHU Ibn Rochd · Service dermatologie chirurgicale.",
            "status": ConsultationStatus.ESCALATED,
        },
        "days_ago": 3,
    },

    # --- 2. Naevus très confiant ---
    {
        "image_id": "ISIC_0024333",
        "region": "Oriental",
        "age_range": "30-45",
        "gender": "F",
        "body_area": "Bras",
        "duration": "1 à 6 mois",
        "symptoms": "Petite tâche brune symétrique, pas d'évolution récente.",
        "ai_prediction": "Naevus mélanocytaire",
        "ai_confidence": 0.95,
        "ai_risk_level": "LOW",
        "ai_is_ood": False,
        "ai_is_uncertain": False,
        "alternatives": [
            {"label": "Kératose bénigne", "score": 0.03},
            {"label": "Mélanome", "score": 0.02},
        ],
        "gemini_description": "Lésion brune symétrique, contours nets, couleur uniforme. Caractéristiques d'un naevus bénin.",
        "gemini_assessment": "benign",
        "gemini_concerns": [],
        "gemini_action": "Surveillance simple de l'évolution.",
        "relais": "relais1",
        "review": {
            "medecin": "medecin1",
            "decision": MedecinDecision.SUIVI,
            "agrees": True,
            "notes": "Naevus banal. Surveillance par le patient. Refaire photo dans 6 mois ou si changement.",
            "prescription": "Photoprotection (SPF 50). Auto-surveillance ABCDE.",
            "status": ConsultationStatus.VALIDATED,
        },
        "days_ago": 2,
    },

    # --- 3. Naevus très confiant (2) ---
    {
        "image_id": "ISIC_0024380",
        "region": "Beni Mellal-Khenifra",
        "age_range": "18-30",
        "gender": "F",
        "body_area": "Jambe",
        "duration": "Plus de 6 mois",
        "symptoms": "Grain de beauté présent depuis l'enfance, stable.",
        "ai_prediction": "Naevus mélanocytaire",
        "ai_confidence": 0.97,
        "ai_risk_level": "LOW",
        "ai_is_ood": False,
        "ai_is_uncertain": False,
        "alternatives": [
            {"label": "Kératose bénigne", "score": 0.02},
            {"label": "Dermatofibrome", "score": 0.01},
        ],
        "gemini_description": "Naevus typique, parfaitement symétrique, couleur homogène.",
        "gemini_assessment": "benign",
        "gemini_concerns": [],
        "gemini_action": "Aucune action particulière requise.",
        "relais": "infirmier1",
        "review": None,
        "days_ago": 1,
    },

    # --- 4. Cas incertain (à examiner) ---
    {
        "image_id": "ISIC_0024406",
        "region": "Draa-Tafilalet",
        "age_range": "45-60",
        "gender": "M",
        "body_area": "Visage",
        "duration": "1 à 4 semaines",
        "symptoms": "Lésion croûteuse apparue récemment sur la joue, légèrement saignante.",
        "ai_prediction": "Kératose actinique",
        "ai_confidence": 0.52,
        "ai_risk_level": "MEDIUM",
        "ai_is_ood": False,
        "ai_is_uncertain": True,
        "alternatives": [
            {"label": "Carcinome basocellulaire", "score": 0.31},
            {"label": "Kératose bénigne", "score": 0.10},
        ],
        "gemini_description": "Lésion croûteuse, pourrait être actinique ou un début de carcinome. Difficile à trancher sans examen clinique.",
        "gemini_assessment": "atypical",
        "gemini_concerns": ["Lésion saignante récente", "Localisation photo-exposée"],
        "gemini_action": "Consultation dermatologique recommandée pour examen clinique.",
        "relais": "relais2",
        "review": None,
        "days_ago": 1,
    },

    # --- 5. BCC haute confiance ---
    {
        "image_id": "ISIC_0024450",
        "region": "Rabat-Sale-Kenitra",
        "age_range": "60-75",
        "gender": "M",
        "body_area": "Visage",
        "duration": "Plus de 6 mois",
        "symptoms": "Petite plaque rosée perlée sur le nez, ne cicatrise pas.",
        "ai_prediction": "Carcinome basocellulaire",
        "ai_confidence": 0.84,
        "ai_risk_level": "HIGH",
        "ai_is_ood": False,
        "ai_is_uncertain": False,
        "alternatives": [
            {"label": "Kératose actinique", "score": 0.10},
            {"label": "Naevus mélanocytaire", "score": 0.04},
        ],
        "gemini_description": "Lésion rosée, perlée, télangiectasies visibles. Aspect typique d'un carcinome basocellulaire.",
        "gemini_assessment": "suspicious",
        "gemini_concerns": ["Aspect perlé caractéristique", "Lésion qui ne cicatrise pas", "Localisation photo-exposée"],
        "gemini_action": "Biopsie + exérèse chirurgicale dans les 7 jours.",
        "relais": "relais1",
        "review": None,
        "days_ago": 0,
    },

    # --- 6. Désaccord IA / Médecin ---
    {
        "image_id": "ISIC_0024500",
        "region": "Oriental",
        "age_range": "45-60",
        "gender": "F",
        "body_area": "Dos",
        "duration": "1 à 6 mois",
        "symptoms": "Tâche brune qui démange un peu.",
        "ai_prediction": "Naevus mélanocytaire",
        "ai_confidence": 0.71,
        "ai_risk_level": "LOW",
        "ai_is_ood": False,
        "ai_is_uncertain": False,
        "alternatives": [
            {"label": "Mélanome", "score": 0.18},
            {"label": "Kératose bénigne", "score": 0.06},
        ],
        "gemini_description": "Lésion brune avec asymétrie subtile et un point plus foncé.",
        "gemini_assessment": "suspicious",
        "gemini_concerns": ["Asymétrie subtile", "Démangeaison récente"],
        "gemini_action": "Examen clinique recommandé pour exclure un mélanome débutant.",
        "relais": "relais1",
        "review": {
            "medecin": "medecin2",
            "decision": MedecinDecision.CONSULTATION,
            "agrees": False,
            "modified_diagnosis": "Mélanome débutant suspect",
            "notes": "Je ne suis pas d'accord avec l'IA. L'asymétrie et la démangeaison récente sont préoccupantes. Biopsie nécessaire pour exclure un mélanome.",
            "prescription": "Biopsie excisionnelle sous 7 jours · Service dermato CHU Rabat.",
            "status": ConsultationStatus.VALIDATED,
        },
        "days_ago": 4,
    },
]


def find_image(image_id: str) -> str | None:
    for d in (HAM_PART1, HAM_PART2):
        p = os.path.join(d, f"{image_id}.jpg")
        if os.path.exists(p):
            return p
    return None


def upsert_user(db: Session, data: dict) -> User:
    existing = db.query(User).filter(User.username == data["username"]).first()
    if existing:
        return existing
    user = User(
        username=data["username"],
        password_hash=pwd.hash(data["password"]),
        full_name=data["full_name"],
        role=data["role"],
        region=data.get("region"),
        speciality=data.get("speciality"),
        is_active=True,
        credential_number=data.get("credential_number"),
        verification_status=data.get("verification_status", "not_required"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(
        AuditLog(
            actor_id=user.id,
            actor_role=user.role,
            action="REGISTER",
            resource_type="user",
            resource_id=user.id,
            details={"seed": True},
            timestamp=NOW - timedelta(days=10),
        )
    )
    db.commit()
    return user


def make_consultation(db: Session, spec: dict, user_map: dict[str, User]) -> Consultation | None:
    src = find_image(spec["image_id"])
    if not src:
        print(f"   [SKIP] image {spec['image_id']} introuvable, consultation ignoree")
        return None

    # Copie l'image dans uploads/
    saved_filename = f"{uuid.uuid4().hex}.jpg"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)
    shutil.copyfile(src, saved_path)

    # Patient anonymise
    region = spec["region"]
    anonymous_id = (
        f"{region[:3].upper()}-{NOW.strftime('%Y')}-{uuid.uuid4().hex[:5].upper()}"
    )
    patient = Patient(
        anonymous_id=anonymous_id,
        age_range=spec["age_range"],
        gender=spec["gender"],
        region=region,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    relais = user_map[spec["relais"]]
    created_at = NOW - timedelta(days=spec["days_ago"])

    review_spec = spec.get("review")
    status = (
        review_spec["status"].value if review_spec else ConsultationStatus.AI_ANALYZED.value
    )

    consultation = Consultation(
        patient_id=patient.id,
        created_by=relais.id,
        status=status,
        symptoms=spec["symptoms"],
        symptoms_duration=spec["duration"],
        body_area=spec["body_area"],
        image_path=f"/uploads/{saved_filename}",
        image_original_name=f"{spec['image_id']}.jpg",
        ai_prediction=spec["ai_prediction"],
        ai_confidence=spec["ai_confidence"],
        ai_risk_level=spec["ai_risk_level"],
        ai_is_uncertain=spec["ai_is_uncertain"],
        ai_is_ood=spec["ai_is_ood"],
        ai_entropy=0.5 if spec["ai_is_uncertain"] else 0.2,
        ai_alternatives=spec["alternatives"],
        ai_all_scores={a["label"]: a["score"] for a in spec["alternatives"]},
        ai_request_id=f"REQ-SEED-{uuid.uuid4().hex[:8].upper()}",
        ai_model_version="AMANE-ResNet18-v1.0",
        ai_latency=0.7,
        gemini_description=spec.get("gemini_description"),
        gemini_assessment=spec.get("gemini_assessment"),
        gemini_concerns=spec.get("gemini_concerns"),
        gemini_action=spec.get("gemini_action"),
        gemini_model="gemini-2.0-flash",
        heatmap_path=None,  # pas de heatmap pour le seed (couteux)
        heatmap_bounding_box={"x": 50, "y": 50, "width": 124, "height": 124},
        created_at=created_at,
        analyzed_at=created_at + timedelta(seconds=2),
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    db.add(
        AuditLog(
            actor_id=relais.id,
            actor_role=relais.role,
            action="UPLOAD_AND_ANALYZE",
            resource_type="consultation",
            resource_id=consultation.id,
            details={
                "ai_prediction": spec["ai_prediction"],
                "ai_confidence": spec["ai_confidence"],
                "seed": True,
            },
            timestamp=created_at,
        )
    )
    db.commit()

    if review_spec:
        medecin = user_map[review_spec["medecin"]]
        review_at = created_at + timedelta(hours=4)
        review = MedecinReview(
            consultation_id=consultation.id,
            medecin_id=medecin.id,
            decision=review_spec["decision"].value,
            agrees_with_ai=review_spec["agrees"],
            modified_diagnosis=review_spec.get("modified_diagnosis"),
            notes=review_spec["notes"],
            prescription=review_spec.get("prescription"),
            reviewed_at=review_at,
        )
        db.add(review)
        consultation.reviewed_at = review_at
        db.commit()

        db.add(
            AuditLog(
                actor_id=medecin.id,
                actor_role=medecin.role,
                action="REVIEW_DECISION",
                resource_type="consultation",
                resource_id=consultation.id,
                details={
                    "decision": review_spec["decision"].value,
                    "agrees_with_ai": review_spec["agrees"],
                    "seed": True,
                },
                timestamp=review_at,
            )
        )
        db.commit()

    return consultation


def reset_db(db: Session) -> None:
    """Supprime toutes les donnees (DEV ONLY). Garde le schema."""
    print(">> RESET : suppression de toutes les donnees existantes...")
    db.query(AuditLog).delete()
    db.query(MedecinReview).delete()
    db.query(Consultation).delete()
    db.query(Patient).delete()
    db.query(User).delete()
    db.commit()


def main():
    parser = argparse.ArgumentParser(description="Seed AMANE pour demo MIATHON")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Supprime toutes les donnees existantes avant de seed (DEV ONLY)",
    )
    args = parser.parse_args()

    print("=" * 64)
    print("[AMANE SEED]")
    print("=" * 64)

    create_tables()
    ensure_columns()
    ensure_indexes()

    db = SessionLocal()
    try:
        if args.reset:
            reset_db(db)

        # Users
        print("\n>> Creation des utilisateurs...")
        user_map: dict[str, User] = {}
        for u in USERS:
            user = upsert_user(db, u)
            user_map[u["username"]] = user
            print(f"   - {user.role:>10} : {user.username} ({user.full_name})")

        # Consultations
        print(f"\n>> Creation de {len(CONSULTATIONS)} consultations...")
        created = 0
        for spec in CONSULTATIONS:
            c = make_consultation(db, spec, user_map)
            if c:
                created += 1
                tag = "✓ reviewé" if spec.get("review") else "  en attente"
                print(
                    f"   {tag} [{spec['ai_risk_level']:>8}] {spec['ai_prediction']:>30} "
                    f"({int(spec['ai_confidence'] * 100)}%)  -  {spec['region']}"
                )

        print(f"\n[DONE] {created}/{len(CONSULTATIONS)} consultations seeded.")
        print("\nComptes pour la demo :")
        print("   - admin1     / admin1234   (admin)")
        print("   - medecin1   / medecin123  (medecin · Casablanca)")
        print("   - medecin2   / medecin123  (medecin · Rabat)")
        print("   - relais1    / relais123   (relais · Oriental)")
        print("   - relais2    / relais123   (relais · Draa-Tafilalet)")
        print("   - infirmier1 / infirmier123 (infirmier · Beni Mellal)")
        print("   - medecin_new / medecin123  (médecin EN ATTENTE · Fes-Meknès  ← demo vérification)")
        print("=" * 64)
    finally:
        db.close()


if __name__ == "__main__":
    main()
