"""
AMANE - Routeur Dashboard
GET /api/dashboard/stats, /api/dashboard/audit-log
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_role
from ..database import AuditLog, Consultation, ConsultationStatus, MedecinReview, get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    current_user=Depends(require_role("medecin", "admin")),
    db: Session = Depends(get_db),
):
    """Statistiques globales (médecin + admin uniquement)."""
    total = db.query(Consultation).count()
    pending = db.query(Consultation).filter(
        Consultation.status == ConsultationStatus.AI_ANALYZED.value
    ).count()
    validated = db.query(Consultation).filter(
        Consultation.status == ConsultationStatus.VALIDATED.value
    ).count()
    escalated = db.query(Consultation).filter(
        Consultation.status == ConsultationStatus.ESCALATED.value
    ).count()

    total_reviews = db.query(MedecinReview).count()
    agreements = db.query(MedecinReview).filter(
        MedecinReview.agrees_with_ai == True  # noqa: E712
    ).count()
    concordance = (agreements / total_reviews * 100) if total_reviews > 0 else 0

    return {
        "total_consultations": total,
        "pending_review": pending,
        "validated": validated,
        "escalated": escalated,
        "concordance_ia_medecin": round(concordance, 1),
        "total_reviews": total_reviews,
    }


@router.get("/audit-log")
def get_audit_log(
    limit: int = 50,
    offset: int = 0,
    response: Response = None,
    current_user=Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Journal d'audit (admin uniquement). Pagination via limit + offset."""
    limit = max(1, min(limit, 500))
    offset = max(0, offset)

    total = db.query(AuditLog).count()
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    if response is not None:
        response.headers["X-Total-Count"] = str(total)

    return [
        {
            "id": log.id,
            "actor_id": log.actor_id,
            "actor_role": log.actor_role,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]
