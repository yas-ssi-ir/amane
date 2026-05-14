"""
AMANE - Schemas Pydantic (validation entree/sortie API).
"""

from typing import List, Literal, Optional
from datetime import datetime

from pydantic import BaseModel, Field


# Roles autorises a la self-registration via /api/auth/register
# Admin reste cree par seed.py uniquement (privilege trop sensible).
PublicRole = Literal["relais", "infirmier", "medecin"]
DecisionType = Literal["traitement_simple", "suivi", "consultation", "urgence"]
VerificationStatusType = Literal["not_required", "pending", "approved", "rejected"]


# ============================================
# Schemas Utilisateur
# ============================================
class UserCreate(BaseModel):
    """Self-registration — relais / infirmier / medecin.

    Pour infirmier et medecin, credential_number est obligatoire.
    La validation metier est faite dans le endpoint register().
    Admin reste cree par seed.py uniquement.
    """
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: PublicRole = "relais"
    phone: Optional[str] = Field(None, max_length=20)
    region: Optional[str] = Field(None, max_length=100)
    speciality: Optional[str] = Field(None, max_length=100)
    credential_number: Optional[str] = Field(None, min_length=2, max_length=100)


class UserLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    region: Optional[str] = None
    verification_status: str = "not_required"
    credential_number: Optional[str] = None


class VerifyUserRequest(BaseModel):
    status: Literal["approved", "rejected"]
    notes: Optional[str] = Field(None, max_length=500)


# ============================================
# Schemas Patient
# ============================================
class PatientCreate(BaseModel):
    age_range: Literal["0-5", "5-12", "12-18", "18-30", "30-45", "45-60", "60-75", "75+"]
    gender: Literal["M", "F", "AUTRE"]
    region: str = Field(..., min_length=2, max_length=100)
    commune: Optional[str] = Field(None, max_length=100)


# ============================================
# Schemas Consultation
# ============================================
class ConsultationCreate(BaseModel):
    symptoms: str = Field(..., min_length=1, max_length=2000)
    symptoms_duration: Optional[str] = Field(None, max_length=100)
    body_area: Optional[str] = Field(None, max_length=100)
    vital_signs: Optional[dict] = None


class AIResultResponse(BaseModel):
    """Le JSON complet retourne par l'IA."""
    request_id: str
    primary_diagnosis: str
    confidence: float
    risk_level: str
    is_uncertain: bool
    is_out_of_distribution: Optional[bool] = False
    alternatives: List[dict]
    heatmap_url: Optional[str] = None
    bounding_box: Optional[dict] = None
    ai_model_version: str
    latency_seconds: float


class ConsultationResponse(BaseModel):
    id: str
    anonymous_patient_id: str
    status: str
    symptoms: str
    body_area: Optional[str] = None
    ai_result: Optional[AIResultResponse] = None
    review: Optional[dict] = None
    created_at: datetime


# ============================================
# Schemas Decision Medecin
# ============================================
class MedecinReviewCreate(BaseModel):
    decision: DecisionType
    agrees_with_ai: bool
    modified_diagnosis: Optional[str] = Field(None, max_length=255)
    notes: str = Field(..., min_length=5, max_length=2000)
    prescription: Optional[str] = Field(None, max_length=2000)


class MedecinReviewResponse(BaseModel):
    id: str
    decision: DecisionType
    agrees_with_ai: bool
    modified_diagnosis: Optional[str] = None
    notes: str
    prescription: Optional[str] = None
    medecin_name: str
    reviewed_at: datetime


# ============================================
# Schemas Auth — changement de mot de passe
# ============================================
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


# ============================================
# Schemas Admin — création de compte
# ============================================
class AdminCreateUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: Literal["relais", "infirmier", "medecin", "admin"]
    phone: Optional[str] = Field(None, max_length=20)
    region: Optional[str] = Field(None, max_length=100)
    speciality: Optional[str] = Field(None, max_length=100)


# ============================================
# Schemas Chat IA
# ============================================
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    message: str
