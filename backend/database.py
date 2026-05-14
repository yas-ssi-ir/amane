"""
AMANE - Configuration de la Base de Données
Utilise SQLAlchemy pour la gestion des données.
Inclut l'Audit Trail (traçabilité) — un pilier de l'Infrastructure de Confiance.
"""

from sqlalchemy import (
    create_engine, Column, String, Float, Boolean, DateTime, Text,
    Enum, Integer, JSON, ForeignKey, text
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from datetime import datetime, timedelta, timezone
import os
import uuid
import enum

# Retention du journal d'audit (en jours). Configurable via env.
# Defaut : 365 jours = 1 an, conservateur pour un contexte medical.
AUDIT_LOG_RETENTION_DAYS = int(os.getenv("AMANE_AUDIT_RETENTION_DAYS", "365"))


def _utcnow() -> datetime:
    """datetime UTC naive (compatibilite SQLAlchemy DateTime sans tz)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ============================================
# Configuration de connexion
# ============================================
# Pour le hackathon, on utilise SQLite (zéro config).
# En production, on passerait à PostgreSQL.
DATABASE_URL = "sqlite:///./amane.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ============================================
# Enums (Les choix possibles)
# ============================================
class UserRole(str, enum.Enum):
    RELAIS = "relais"           # Instituteur, Association, Pharmacien
    INFIRMIER = "infirmier"     # Agent de santé terrain
    MEDECIN = "medecin"         # Médecin spécialiste distant
    ADMIN = "admin"             # Superviseur / Autorité locale


class ConsultationStatus(str, enum.Enum):
    SUBMITTED = "submitted"             # Envoyée par le relais
    AI_ANALYZED = "ai_analyzed"         # IA a fini l'analyse
    PENDING_REVIEW = "pending_review"   # En attente du médecin
    VALIDATED = "validated"             # Médecin a validé
    REJECTED = "rejected"               # Médecin a rejeté / demande plus d'infos
    ESCALATED = "escalated"             # Urgence — transfert hôpital


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class MedecinDecision(str, enum.Enum):
    TRAITEMENT_SIMPLE = "traitement_simple"    # 💊 Vert
    SUIVI = "suivi"                            # 📅 Bleu
    CONSULTATION = "consultation"              # 🏥 Orange
    URGENCE = "urgence"                        # 🚨 Rouge


# ============================================
# Modèles de données (Tables)
# ============================================

class User(Base):
    """Utilisateurs du système (Relais, Infirmier, Médecin, Admin)."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # UserRole
    phone = Column(String(20))
    region = Column(String(100))
    speciality = Column(String(100))     # Pour les médecins
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)

    # Vérification des justificatifs professionnels
    credential_number = Column(String(100))          # Numéro d'ordre (ONIP / CNOM)
    credential_doc_path = Column(String(500))        # Photo CIN / diplôme / permis d'exercer
    verification_status = Column(String(20), default='not_required')  # not_required | pending | approved | rejected
    verification_notes = Column(Text)                # Motif de refus éventuel

    # Relations
    consultations_created = relationship("Consultation", back_populates="created_by_user", foreign_keys="Consultation.created_by")
    reviews = relationship("MedecinReview", back_populates="medecin")


class Patient(Base):
    """Patients anonymisés — AUCUN nom stocké (Loi 09-08)."""
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    anonymous_id = Column(String(50), unique=True, nullable=False)  # Ex: "OUJ-2026-042"
    age_range = Column(String(20))       # "20-30", "30-40" (pas l'âge exact)
    gender = Column(String(10))          # M, F, Autre
    region = Column(String(100), index=True)
    commune = Column(String(100))
    created_at = Column(DateTime, default=_utcnow)

    # Critères multi-facteurs (caravane / priorité)
    health_coverage = Column(String(20))  # cnss | mutuelle | ramed | non_assure
    zone_type = Column(String(10))        # rural | urbain | periurbain
    latitude = Column(Float)              # GPS (optionnel)
    longitude = Column(Float)            # GPS (optionnel)

    # Relations
    consultations = relationship("Consultation", back_populates="patient")


class Consultation(Base):
    """Une consultation = 1 image + 1 analyse IA + 1 décision médecin."""
    __tablename__ = "consultations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String(30), default=ConsultationStatus.SUBMITTED.value, index=True)

    # Données cliniques
    symptoms = Column(Text, nullable=False)
    symptoms_duration = Column(String(50))
    body_area = Column(String(50))          # "bras gauche", "dos", "visage"
    vital_signs = Column(JSON)              # {"temperature": 37.5}

    # Image médicale
    image_path = Column(String(500))
    image_original_name = Column(String(255))

    # Résultats IA (ResNet18 specialise)
    ai_prediction = Column(String(100))
    ai_confidence = Column(Float)
    ai_risk_level = Column(String(20))
    ai_is_uncertain = Column(Boolean, default=False)
    ai_is_ood = Column(Boolean, default=False)  # image hors-distribution
    ai_entropy = Column(Float)                  # entropie normalisee [0, 1]
    ai_alternatives = Column(JSON)              # [{"label": "...", "score": 0.15}]
    ai_all_scores = Column(JSON)
    ai_request_id = Column(String(50))
    ai_model_version = Column(String(50))
    ai_latency = Column(Float)

    # Second avis Gemini (multimodal)
    gemini_description = Column(Text)           # description en langage naturel
    gemini_assessment = Column(String(20))      # benign | suspicious | atypical | unclear | non_lesion
    gemini_concerns = Column(JSON)              # liste de signes ABCDE detectes
    gemini_action = Column(Text)                # recommandation d'action
    gemini_model = Column(String(50))           # version du modele Gemini utilise

    # Heatmap (Explicabilité)
    heatmap_path = Column(String(500))
    heatmap_bounding_box = Column(JSON)     # {"x": 120, "y": 45, "w": 300, "h": 300}

    # Vidéo patient (description orale facultative)
    video_path = Column(String(500))

    # Score de priorité multi-critères [0.0 – 1.0] (caravane médicale)
    priority_score = Column(Float)

    # Timestamps
    created_at = Column(DateTime, default=_utcnow, index=True)
    analyzed_at = Column(DateTime)
    reviewed_at = Column(DateTime)

    # Relations
    patient = relationship("Patient", back_populates="consultations")
    created_by_user = relationship("User", back_populates="consultations_created", foreign_keys=[created_by])
    review = relationship("MedecinReview", back_populates="consultation", uselist=False)


class MedecinReview(Base):
    """Décision du médecin — Le maillon final de la chaîne de confiance."""
    __tablename__ = "medecin_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id = Column(String, ForeignKey("consultations.id"), nullable=False)
    medecin_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Décision
    decision = Column(String(30), nullable=False)     # MedecinDecision
    agrees_with_ai = Column(Boolean)                  # Le médecin est-il d'accord ?
    modified_diagnosis = Column(String(255))           # Si différent de l'IA
    notes = Column(Text)                              # Instructions au relais
    prescription = Column(Text)                       # Ordonnance / traitement

    reviewed_at = Column(DateTime, default=_utcnow)

    # Relations
    consultation = relationship("Consultation", back_populates="review")
    medecin = relationship("User", back_populates="reviews")


class AuditLog(Base):
    """
    Journal d'audit append-only — Chaque action critique est enregistrée.
    C'est la preuve de la "Responsabilité Humaine Distribuée".

    Politique de rétention : les entrées plus anciennes que
    AUDIT_LOG_RETENTION_DAYS (env, defaut 365) peuvent etre purgees via
    purge_old_audit_logs(). Pas de suppression individuelle.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_id = Column(String, ForeignKey("users.id"))
    actor_role = Column(String(20))
    action = Column(String(50), nullable=False)     # LOGIN, UPLOAD, ANALYZE, VALIDATE, etc.
    resource_type = Column(String(50))              # consultation, patient, review
    resource_id = Column(String)
    details = Column(JSON)                          # Métadonnées additionnelles
    ip_address = Column(String(45))
    timestamp = Column(DateTime, default=_utcnow, index=True)


# ============================================
# Fonctions utilitaires
# ============================================

def create_tables():
    """Crée toutes les tables dans la base de données."""
    Base.metadata.create_all(bind=engine)
    print("✅ Tables AMANE créées avec succès !")


def ensure_indexes():
    """Cree les index si manquants (idempotent). Appele au demarrage.

    SQLAlchemy Column(index=True) ne cree des index que pour les NOUVELLES tables.
    Pour les bases existantes (cas du DB SQLite deja en place), on emet
    explicitement des CREATE INDEX IF NOT EXISTS, supportes par SQLite et PG.
    """
    statements = [
        "CREATE INDEX IF NOT EXISTS ix_consultations_status ON consultations(status)",
        "CREATE INDEX IF NOT EXISTS ix_consultations_created_at ON consultations(created_at)",
        "CREATE INDEX IF NOT EXISTS ix_patients_region ON patients(region)",
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_timestamp ON audit_logs(timestamp)",
        # Unicite : une seule review par consultation (anti double-validation)
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_medecin_reviews_consultation ON medecin_reviews(consultation_id)",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
    print(f"✅ Index DB verifies ({len(statements)} index)")


def ensure_columns():
    """Ajoute les colonnes manquantes aux tables existantes (best-effort migration).

    Permet d'evoluer le schema sans tout recreer la DB en dev. Sur PG en prod,
    utiliser Alembic. SQLite ignore l'erreur si la colonne existe deja.
    """
    migrations = [
        # ai_is_ood et ai_entropy ajoutes apres v1
        ("consultations", "ai_is_ood", "BOOLEAN DEFAULT 0"),
        ("consultations", "ai_entropy", "FLOAT"),
        # Gemini second avis IA
        ("consultations", "gemini_description", "TEXT"),
        ("consultations", "gemini_assessment", "VARCHAR(20)"),
        ("consultations", "gemini_concerns", "JSON"),
        ("consultations", "gemini_action", "TEXT"),
        ("consultations", "gemini_model", "VARCHAR(50)"),
        ("consultations", "video_path", "VARCHAR(500)"),
        # Vérification professionnelle (ajoutée après v1)
        ("users", "credential_number", "VARCHAR(100)"),
        ("users", "credential_doc_path", "VARCHAR(500)"),
        ("users", "verification_status", "VARCHAR(20) DEFAULT 'not_required'"),
        ("users", "verification_notes", "TEXT"),
        # Critères multi-facteurs patient
        ("patients", "health_coverage", "VARCHAR(20)"),
        ("patients", "zone_type", "VARCHAR(10)"),
        ("patients", "latitude", "FLOAT"),
        ("patients", "longitude", "FLOAT"),
        # Score de priorité caravane calculé au moment de l'analyse IA
        ("consultations", "priority_score", "FLOAT"),
    ]
    with engine.begin() as conn:
        for table, col, definition in migrations:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {definition}"))
                print(f"   [MIGRATION] Ajout colonne {table}.{col}")
            except Exception:
                # Colonne deja existante (le plus frequent)
                pass


def purge_old_audit_logs(db, days: int | None = None) -> int:
    """Supprime les entrees du journal d'audit plus vieilles que `days` jours.

    Retourne le nombre de lignes supprimees.
    Default : AUDIT_LOG_RETENTION_DAYS (env, 365 par defaut).
    """
    if days is None:
        days = AUDIT_LOG_RETENTION_DAYS
    if days <= 0:
        raise ValueError("days doit etre > 0")
    cutoff = _utcnow() - timedelta(days=days)
    deleted = db.query(AuditLog).filter(AuditLog.timestamp < cutoff).delete(
        synchronize_session=False
    )
    db.commit()
    return deleted


def get_db():
    """
    Générateur de session pour FastAPI (Dependency Injection).
    Utilisé comme: db = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def log_action(db, actor_id: str, actor_role: str, action: str,
               resource_type: str = None, resource_id: str = None,
               details: dict = None, ip_address: str = None):
    """Ajoute une entree d'audit a la session DB (sans commit).

    IMPORTANT : ne fait PAS de commit pour preserver l'atomicite de la
    transaction du caller. Le caller doit faire `db.commit()` ensuite.
    Cela evite qu'une exception apres log_action laisse l'audit committe
    mais l'action principale annulee (incoherence).
    """
    audit_entry = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(audit_entry)
    db.flush()  # rend l'entree visible dans la transaction sans commit


# Créer les tables au démarrage
if __name__ == "__main__":
    create_tables()
