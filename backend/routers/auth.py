"""
AMANE - Routeur Authentification
POST /api/auth/register, /api/auth/login, GET /api/auth/me, ...
"""

import os
import uuid
from io import BytesIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from ..auth import (
    create_access_token,
    get_client_ip,
    get_current_user,
    pwd_context,
    rate_limit,
)
from ..core.config import CREDENTIAL_ALLOWED_MIME, CREDENTIAL_DIR, CREDENTIAL_MAX_BYTES
from ..database import (
    Consultation,
    MedecinDecision,
    MedecinReview,
    User,
    get_db,
    log_action,
)
from ..schemas import (
    ChangePasswordRequest,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse,
             dependencies=[Depends(rate_limit("register"))])
def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Self-registration : relais / infirmier / medecin."""
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur existe déjà")

    needs_credential = user_data.role in ("infirmier", "medecin")
    if needs_credential and not (user_data.credential_number or "").strip():
        label = "Numéro ONIP" if user_data.role == "infirmier" else "Numéro CNOM"
        raise HTTPException(
            status_code=422,
            detail=f"{label} obligatoire pour les professionnels de santé",
        )

    verification_status = "pending" if needs_credential else "not_required"

    new_user = User(
        username=user_data.username,
        password_hash=pwd_context.hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        region=user_data.region,
        speciality=user_data.speciality,
        credential_number=(user_data.credential_number or "").strip() or None,
        verification_status=verification_status,
    )
    db.add(new_user)
    db.flush()
    log_action(
        db, new_user.id, new_user.role, "REGISTER",
        "user", new_user.id,
        details={"verification_status": verification_status},
        ip_address=get_client_ip(request),
    )
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        full_name=new_user.full_name,
        role=new_user.role,
        region=new_user.region,
        verification_status=new_user.verification_status,
        credential_number=new_user.credential_number,
    )


@router.post("/login", dependencies=[Depends(rate_limit("login"))])
def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authentification — retourne un JWT signé HS256."""
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not pwd_context.verify(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    log_action(db, user.id, user.role, "LOGIN", "user", user.id,
               ip_address=get_client_ip(request))
    db.commit()

    token_info = create_access_token(user_id=user.id, role=user.role)
    return {
        **token_info,
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "region": user.region,
            "verification_status": user.verification_status,
            "credential_number": user.credential_number,
        },
    }


@router.get("/me")
def whoami(current_user: User = Depends(get_current_user)):
    """Retourne l'utilisateur courant depuis le JWT."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "region": current_user.region,
        "verification_status": current_user.verification_status,
        "credential_number": current_user.credential_number,
        "credential_doc_url": current_user.credential_doc_path,
    }


@router.get("/me/stats")
def my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stats personnelles : médecin → ses reviews ; admin → totaux système."""
    if current_user.role == "medecin":
        reviews = db.query(MedecinReview).filter(
            MedecinReview.medecin_id == current_user.id
        ).all()
        agrees = sum(1 for r in reviews if r.agrees_with_ai)
        last_rev = max((r.reviewed_at for r in reviews if r.reviewed_at), default=None)
        urgences = sum(
            1 for r in reviews if r.decision == MedecinDecision.URGENCE.value
        )
        return {
            "total_reviews": len(reviews),
            "concordance_rate": round(agrees / len(reviews) * 100, 1) if reviews else 0,
            "last_review_at": last_rev.isoformat() if last_rev else None,
            "urgences_escaladees": urgences,
        }
    else:
        from ..database import Consultation
        total_consultations = db.query(Consultation).count()
        total_users = db.query(User).count()
        pending_verif = db.query(User).filter(
            User.verification_status == "pending"
        ).count()
        total_reviews = db.query(MedecinReview).count()
        return {
            "total_consultations": total_consultations,
            "total_users": total_users,
            "pending_verifications": pending_verif,
            "total_reviews": total_reviews,
        }


@router.patch("/password")
def change_password(
    body: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Changement de mot de passe — vérifie l'ancien avant d'enregistrer le nouveau."""
    if not pwd_context.verify(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    current_user.password_hash = pwd_context.hash(body.new_password)
    log_action(db, current_user.id, current_user.role, "CHANGE_PASSWORD",
               "user", current_user.id, ip_address=get_client_ip(request))
    db.commit()
    return {"message": "Mot de passe mis à jour avec succès"}


@router.post("/credential-document")
async def upload_credential_document(
    request: Request,
    doc: UploadFile = File(...),
    doc_type: str = Form("carte_nationale"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Télécharge le justificatif professionnel (CIN, diplôme, permis d'exercer)."""
    if current_user.role not in ("infirmier", "medecin"):
        raise HTTPException(
            status_code=403,
            detail="Justificatif uniquement pour infirmier/médecin",
        )

    mime = (doc.content_type or "").lower()
    if mime not in CREDENTIAL_ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Format non supporté : {mime}. Acceptés : JPEG, PNG, WebP",
        )

    content = await doc.read()
    if len(content) > CREDENTIAL_MAX_BYTES:
        raise HTTPException(status_code=413, detail="Document trop volumineux (max 10 MB)")

    try:
        from PIL import Image as PilImage
        PilImage.open(BytesIO(content)).verify()
    except Exception:
        raise HTTPException(status_code=422, detail="Fichier image invalide ou corrompu")

    ext_map = {
        "image/jpeg": ".jpg", "image/jpg": ".jpg",
        "image/png": ".png", "image/webp": ".webp",
    }
    ext = ext_map.get(mime, ".jpg")
    filename = f"cred_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    path = os.path.join(CREDENTIAL_DIR, filename)

    with open(path, "wb") as f:
        f.write(content)

    old_path = current_user.credential_doc_path
    if old_path:
        old_full = os.path.join(os.path.dirname(os.path.dirname(__file__)), old_path.lstrip("/"))
        if os.path.exists(old_full):
            try:
                os.remove(old_full)
            except OSError:
                pass

    current_user.credential_doc_path = f"/uploads/credentials/{filename}"
    if current_user.verification_status == "not_required":
        current_user.verification_status = "pending"

    log_action(
        db, current_user.id, current_user.role, "UPLOAD_CREDENTIAL_DOC",
        "user", current_user.id,
        {"doc_type": doc_type, "filename": filename},
        ip_address=get_client_ip(request),
    )
    db.commit()

    return {
        "credential_doc_url": current_user.credential_doc_path,
        "doc_type": doc_type,
        "message": "Document téléchargé avec succès",
    }
