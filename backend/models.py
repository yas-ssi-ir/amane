"""
backend/models.py — re-export des modeles SQLAlchemy depuis database.py.

Conserve pour stabilite des imports historiques. Les definitions de tables
sont dans backend/database.py (source de verite unique).
"""

from .database import (
    AuditLog,
    Consultation,
    ConsultationStatus,
    MedecinDecision,
    MedecinReview,
    Patient,
    RiskLevel,
    User,
    UserRole,
)

__all__ = [
    "AuditLog",
    "Consultation",
    "ConsultationStatus",
    "MedecinDecision",
    "MedecinReview",
    "Patient",
    "RiskLevel",
    "User",
    "UserRole",
]
