"""
AMANE - Routeur Consultations
POST /api/consultations, GET /api/consultations, GET /api/consultations/{id},
POST /api/consultations/{id}/review
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..auth import get_client_ip, get_current_user, require_role, rate_limit
from ..core import ai_state, prediction_cache
from ..core.priority import compute_priority_score
from ..core.config import (
    AgeRangeType,
    GenderType,
    HEATMAP_DIR,
    UPLOAD_DIR,
    VIDEO_ALLOWED_MIME,
    VIDEO_DIR,
    VIDEO_MAX_BYTES,
)
from ..core.utils import read_and_validate_image, safe_remove
from ..database import (
    Consultation,
    ConsultationStatus,
    MedecinDecision,
    MedecinReview,
    Patient,
    User,
    get_db,
    log_action,
)
from ..schemas import MedecinReviewCreate

router = APIRouter(prefix="/api/consultations", tags=["consultations"])


def _run_predict(image_path: str) -> dict:
    return ai_state.classifier.predict(image_path)


def _run_heatmap(image_path: str) -> dict:
    with ai_state.heatmap_lock:
        return ai_state.explainer.generate_heatmap(image_path)


def _run_gemini(image_path: str) -> Optional[dict]:
    return ai_state.gemini.analyze(image_path)


@router.post("", dependencies=[Depends(rate_limit("upload"))])
async def create_consultation(
    request: Request,
    symptoms: str = Form(..., min_length=1, max_length=2000),
    symptoms_duration: Optional[str] = Form(None, max_length=100),
    body_area: Optional[str] = Form(None, max_length=100),
    age_range: AgeRangeType = Form(...),
    gender: GenderType = Form(...),
    region: str = Form(..., min_length=2, max_length=100),
    health_coverage: Optional[str] = Form(None),  # cnss | mutuelle | ramed | non_assure
    zone_type: Optional[str] = Form(None),         # rural | periurbain | urbain
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    file: UploadFile = File(...),
    video: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Créer une consultation. Flux : upload → IA → heatmap + Gemini → DB (1 commit atomique)."""
    import logging
    logger = logging.getLogger("amane")

    content, extension = await read_and_validate_image(file)

    saved_filename = f"{uuid.uuid4().hex}{extension}"
    saved_path = f"{UPLOAD_DIR}/{saved_filename}"
    with open(saved_path, "wb") as buf:
        buf.write(content)

    created_files: list[str] = [saved_path]
    heatmap_filename: Optional[str] = None
    saved_video_path: Optional[str] = None

    if video and video.filename:
        mime = (video.content_type or "").lower()
        if mime not in VIDEO_ALLOWED_MIME:
            raise HTTPException(
                status_code=415,
                detail=f"Format vidéo non supporté : {mime}. Utilisez MP4 ou MOV.",
            )
        video_content = await video.read()
        if len(video_content) > VIDEO_MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Vidéo trop volumineuse (max 80 MB / 60 s à 480p).",
            )
        ext_map = {
            "video/mp4": ".mp4", "video/quicktime": ".mov",
            "video/x-m4v": ".m4v", "video/x-matroska": ".mkv",
        }
        video_ext = ext_map.get(mime, ".mp4")
        video_filename = f"{uuid.uuid4().hex}{video_ext}"
        saved_video_path = f"{VIDEO_DIR}/{video_filename}"
        with open(saved_video_path, "wb") as vf:
            vf.write(video_content)
        created_files.append(saved_video_path)

    try:
        anonymous_id = (
            f"{region[:3].upper()}-{datetime.now().strftime('%Y')}-"
            f"{uuid.uuid4().hex[:5].upper()}"
        )
        patient = Patient(
            anonymous_id=anonymous_id, age_range=age_range,
            gender=gender, region=region,
            health_coverage=health_coverage,
            zone_type=zone_type,
            latitude=latitude,
            longitude=longitude,
        )
        db.add(patient)
        db.flush()

        try:
            cached = prediction_cache.get(content)
            if cached is not None:
                ai_result = cached
                logger.info("Cache hit pour l'image (sha256 match)")
            else:
                ai_result = await run_in_threadpool(_run_predict, saved_path)
                prediction_cache.put(content, ai_result)
            ai_data = ai_result["data"]
        except Exception as e:
            logger.exception("Erreur classifier.predict")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de l'analyse IA : {type(e).__name__}",
            )

        heatmap_coro = run_in_threadpool(_run_heatmap, saved_path)
        gemini_coro = run_in_threadpool(_run_gemini, saved_path)
        heatmap_outcome, gemini_outcome = await asyncio.gather(
            heatmap_coro, gemini_coro, return_exceptions=True
        )

        if isinstance(heatmap_outcome, Exception):
            logger.exception("Erreur generate_heatmap", exc_info=heatmap_outcome)
            raise HTTPException(
                status_code=500,
                detail=f"Erreur génération heatmap : {type(heatmap_outcome).__name__}",
            )
        heatmap_result = heatmap_outcome
        heatmap_filename = heatmap_result.get("heatmap_filename")
        if heatmap_filename:
            created_files.append(f"{HEATMAP_DIR}/{heatmap_filename}")

        gemini_result = None if isinstance(gemini_outcome, Exception) else gemini_outcome

        priority_score = compute_priority_score(
            risk_level=ai_data.get("risk_level"),
            gemini_assessment=gemini_result.get("assessment") if gemini_result else None,
            health_coverage=health_coverage,
            zone_type=zone_type,
            age_range=age_range,
        )

        consultation = Consultation(
            patient_id=patient.id,
            created_by=current_user.id,
            status=ConsultationStatus.AI_ANALYZED.value,
            symptoms=symptoms,
            symptoms_duration=symptoms_duration,
            body_area=body_area,
            image_path=f"/uploads/{saved_filename}",
            image_original_name=file.filename,
            ai_prediction=ai_data["primary_diagnosis"],
            ai_confidence=ai_data["confidence"],
            ai_risk_level=ai_data["risk_level"],
            ai_is_uncertain=ai_data["is_uncertain"],
            ai_is_ood=ai_data.get("is_out_of_distribution", False),
            ai_entropy=ai_data.get("entropy_normalized"),
            ai_alternatives=ai_data["alternatives"],
            ai_all_scores=ai_data["all_scores"],
            ai_request_id=ai_result["request_id"],
            ai_model_version=ai_data["metadata"]["model_version"],
            ai_latency=ai_data["metadata"]["latency_seconds"],
            gemini_description=gemini_result.get("description") if gemini_result else None,
            gemini_assessment=gemini_result.get("assessment") if gemini_result else None,
            gemini_concerns=gemini_result.get("concerns") if gemini_result else None,
            gemini_action=gemini_result.get("recommended_action") if gemini_result else None,
            gemini_model=gemini_result.get("model") if gemini_result else None,
            heatmap_path=f"/uploads/heatmaps/{heatmap_filename}" if heatmap_filename else None,
            heatmap_bounding_box=heatmap_result["bounding_box"],
            video_path=(
                f"/uploads/videos/{video_filename}" if saved_video_path else None
            ),
            priority_score=priority_score,
            analyzed_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        db.add(consultation)
        db.flush()
        db.refresh(consultation)

        log_action(
            db, current_user.id, current_user.role, "UPLOAD_AND_ANALYZE",
            "consultation", consultation.id,
            {"ai_prediction": ai_data["primary_diagnosis"], "ai_confidence": ai_data["confidence"]},
            ip_address=get_client_ip(request),
        )
        db.commit()

        return {
            "consultation_id": consultation.id,
            "anonymous_patient_id": anonymous_id,
            "status": consultation.status,
            "ai_result": {
                "request_id": ai_result["request_id"],
                "primary_diagnosis": ai_data["primary_diagnosis"],
                "confidence": ai_data["confidence"],
                "risk_level": ai_data["risk_level"],
                "is_uncertain": ai_data["is_uncertain"],
                "is_out_of_distribution": ai_data.get("is_out_of_distribution", False),
                "entropy_normalized": ai_data.get("entropy_normalized"),
                "alternatives": ai_data["alternatives"],
                "heatmap_url": consultation.heatmap_path,
                "bounding_box": heatmap_result["bounding_box"],
                "model_version": ai_data["metadata"]["model_version"],
                "latency_seconds": ai_data["metadata"]["latency_seconds"],
            },
            "gemini": gemini_result,
        }

    except HTTPException:
        db.rollback()
        for f in created_files:
            safe_remove(f)
        raise
    except Exception as e:
        logger.exception("Erreur inattendue dans create_consultation")
        db.rollback()
        for f in created_files:
            safe_remove(f)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur inattendue : {type(e).__name__}",
        )


@router.get("")
def list_consultations(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    response: Response = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste paginée des consultations avec X-Total-Count."""
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    query = (
        db.query(Consultation, Patient.anonymous_id, Patient.zone_type, Patient.health_coverage)
        .outerjoin(Patient, Consultation.patient_id == Patient.id)
    )
    if current_user.role in ("relais", "infirmier"):
        query = query.filter(Consultation.created_by == current_user.id)
    if status:
        query = query.filter(Consultation.status == status)

    total = query.count()
    rows = query.order_by(Consultation.created_at.desc()).offset(offset).limit(limit).all()

    if response is not None:
        response.headers["X-Total-Count"] = str(total)

    return [
        {
            "id": c.id,
            "anonymous_patient_id": anon_id or "N/A",
            "status": c.status,
            "symptoms": c.symptoms,
            "body_area": c.body_area,
            "ai_prediction": c.ai_prediction,
            "ai_confidence": c.ai_confidence,
            "ai_risk_level": c.ai_risk_level,
            "image_url": c.image_path,
            "heatmap_url": c.heatmap_path,
            "priority_score": c.priority_score,
            "zone_type": zone_type,
            "health_coverage": health_coverage,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c, anon_id, zone_type, health_coverage in rows
    ]


@router.get("/{consultation_id}", dependencies=[Depends(rate_limit("read"))])
def get_consultation(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Détail complet d'une consultation."""
    c = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation introuvable")
    if current_user.role in ("relais", "infirmier") and c.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Consultation introuvable")

    patient = db.query(Patient).filter(Patient.id == c.patient_id).first()
    review = db.query(MedecinReview).filter(MedecinReview.consultation_id == c.id).first()
    review_data = None
    if review:
        medecin = db.query(User).filter(User.id == review.medecin_id).first()
        review_data = {
            "decision": review.decision,
            "agrees_with_ai": review.agrees_with_ai,
            "modified_diagnosis": review.modified_diagnosis,
            "notes": review.notes,
            "prescription": review.prescription,
            "medecin_name": medecin.full_name if medecin else "N/A",
            "reviewed_at": review.reviewed_at.isoformat() if review.reviewed_at else None,
        }

    return {
        "id": c.id,
        "anonymous_patient_id": patient.anonymous_id if patient else "N/A",
        "status": c.status,
        "symptoms": c.symptoms,
        "symptoms_duration": c.symptoms_duration,
        "body_area": c.body_area,
        "image_url": c.image_path,
        "video_url": c.video_path,
        "ai_result": {
            "request_id": c.ai_request_id,
            "primary_diagnosis": c.ai_prediction,
            "confidence": c.ai_confidence,
            "risk_level": c.ai_risk_level,
            "is_uncertain": c.ai_is_uncertain,
            "is_out_of_distribution": c.ai_is_ood or False,
            "entropy_normalized": c.ai_entropy,
            "alternatives": c.ai_alternatives,
            "all_scores": c.ai_all_scores,
            "heatmap_url": c.heatmap_path,
            "bounding_box": c.heatmap_bounding_box,
            "model_version": c.ai_model_version,
            "latency_seconds": c.ai_latency,
        },
        "gemini": (
            {
                "description": c.gemini_description,
                "assessment": c.gemini_assessment,
                "concerns": c.gemini_concerns,
                "recommended_action": c.gemini_action,
                "model": c.gemini_model,
            }
            if c.gemini_assessment
            else None
        ),
        "review": review_data,
        "priority_score": c.priority_score,
        "patient_profile": {
            "health_coverage": patient.health_coverage if patient else None,
            "zone_type": patient.zone_type if patient else None,
            "latitude": patient.latitude if patient else None,
            "longitude": patient.longitude if patient else None,
        },
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.post("/{consultation_id}/review")
def review_consultation(
    consultation_id: str,
    review_data: MedecinReviewCreate,
    request: Request,
    current_user: User = Depends(require_role("medecin", "admin")),
    db: Session = Depends(get_db),
):
    """Le médecin valide ou corrige le diagnostic."""
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation introuvable")

    if current_user.role == "medecin":
        vstatus = current_user.verification_status
        if vstatus == "pending":
            raise HTTPException(
                status_code=403,
                detail="Votre compte est en attente de vérification. Vous ne pouvez pas valider de consultations.",
            )
        if vstatus == "rejected":
            raise HTTPException(
                status_code=403,
                detail="Votre compte a été refusé. Contactez un administrateur AMANE.",
            )

    existing = (
        db.query(MedecinReview)
        .filter(MedecinReview.consultation_id == consultation_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Cette consultation a déjà été validée.")

    review = MedecinReview(
        consultation_id=consultation_id,
        medecin_id=current_user.id,
        decision=review_data.decision,
        agrees_with_ai=review_data.agrees_with_ai,
        modified_diagnosis=review_data.modified_diagnosis,
        notes=review_data.notes,
        prescription=review_data.prescription,
    )
    db.add(review)

    consultation.status = ConsultationStatus.VALIDATED.value
    consultation.reviewed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    if review_data.decision == MedecinDecision.URGENCE.value:
        consultation.status = ConsultationStatus.ESCALATED.value

    log_action(
        db, current_user.id, current_user.role, "REVIEW_DECISION",
        "consultation", consultation_id,
        {"decision": review_data.decision, "agrees_with_ai": review_data.agrees_with_ai},
        ip_address=get_client_ip(request),
    )
    db.commit()

    return {
        "message": "Décision enregistrée avec succès",
        "consultation_id": consultation_id,
        "decision": review_data.decision,
        "status": consultation.status,
    }
