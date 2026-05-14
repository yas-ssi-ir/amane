"""
AMANE - Routeur Admin
POST /api/admin/users, GET /api/admin/verifications, POST /api/admin/users/{id}/verify,
POST /api/admin/audit/purge
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..auth import get_client_ip, pwd_context, require_role
from ..database import (
    AUDIT_LOG_RETENTION_DAYS,
    User,
    get_db,
    log_action,
    purge_old_audit_logs,
)
from ..schemas import AdminCreateUser, VerifyUserRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/users")
def admin_create_user(
    body: AdminCreateUser,
    request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Création de compte par un admin (tous rôles, y compris admin).
    Les comptes médecin/infirmier créés ici sont automatiquement approuvés.
    """
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur existe déjà")

    new_user = User(
        username=body.username,
        password_hash=pwd_context.hash(body.password),
        full_name=body.full_name,
        role=body.role,
        phone=body.phone,
        region=body.region,
        speciality=body.speciality,
        is_active=True,
        verification_status=(
            "approved" if body.role in ("medecin", "infirmier") else "not_required"
        ),
    )
    db.add(new_user)
    db.flush()
    log_action(
        db, current_user.id, current_user.role, "ADMIN_CREATE_USER",
        "user", new_user.id,
        {"target_role": body.role, "target_username": body.username},
        ip_address=get_client_ip(request),
    )
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "region": new_user.region,
        "verification_status": new_user.verification_status,
    }


@router.get("/verifications")
def list_pending_verifications(
    status: Optional[str] = "pending",
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Liste les utilisateurs dont le justificatif est en attente (ou autre statut)."""
    query = db.query(User).filter(User.role.in_(["infirmier", "medecin"]))
    if status:
        query = query.filter(User.verification_status == status)
    users = query.order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "region": u.region,
            "credential_number": u.credential_number,
            "credential_doc_url": u.credential_doc_path,
            "verification_status": u.verification_status,
            "verification_notes": u.verification_notes,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.post("/users/{user_id}/verify")
def verify_user(
    user_id: str,
    body: VerifyUserRequest,
    request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Approuve ou rejette le justificatif professionnel d'un infirmier/médecin."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if target.role not in ("infirmier", "medecin"):
        raise HTTPException(
            status_code=400,
            detail="Seuls infirmier et médecin requièrent une vérification",
        )

    target.verification_status = body.status
    if body.notes:
        target.verification_notes = body.notes

    log_action(
        db, current_user.id, current_user.role, "VERIFY_USER",
        "user", user_id,
        {"new_status": body.status, "target_role": target.role},
        ip_address=get_client_ip(request),
    )
    db.commit()

    return {
        "user_id": user_id,
        "verification_status": body.status,
        "message": f"Compte {'approuvé' if body.status == 'approved' else 'refusé'} avec succès",
    }


@router.post("/audit/purge")
def purge_audit_log(
    days: Optional[int] = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Purge les entrées du journal d'audit plus vieilles que `days` jours."""
    effective_days = days if days is not None else AUDIT_LOG_RETENTION_DAYS
    try:
        deleted = purge_old_audit_logs(db, days=effective_days)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, current_user.id, current_user.role, "AUDIT_PURGE",
        "audit_log", None,
        {"days": effective_days, "deleted": deleted},
    )
    db.commit()

    return {
        "purged": deleted,
        "older_than_days": effective_days,
        "retention_default_days": AUDIT_LOG_RETENTION_DAYS,
    }
