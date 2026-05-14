/**
 * Types miroir du backend FastAPI.
 * Doit rester en phase avec backend/schemas.py et database.py.
 */

export type UserRole = "relais" | "infirmier" | "medecin" | "admin";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ConsultationStatus =
  | "submitted"
  | "ai_analyzed"
  | "pending_review"
  | "validated"
  | "rejected"
  | "escalated";

export type Gender = "M" | "F" | "AUTRE";

export type AgeRange =
  | "0-5" | "5-12" | "12-18" | "18-30"
  | "30-45" | "45-60" | "60-75" | "75+";

export type MedecinDecision =
  | "traitement_simple" | "suivi" | "consultation" | "urgence";

export type VerificationStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  region?: string | null;
  verification_status?: VerificationStatus;
  credential_number?: string | null;
}

export interface PendingVerificationUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  region: string | null;
  credential_number: string | null;
  credential_doc_url: string | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  created_at: string | null;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
  user: User;
}

export interface Alternative {
  label: string;
  score: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AIResult {
  request_id: string;
  primary_diagnosis: string;
  confidence: number;
  risk_level: RiskLevel;
  is_uncertain: boolean;
  is_out_of_distribution?: boolean;
  entropy_normalized?: number | null;
  alternatives: Alternative[];
  all_scores?: Record<string, number>;
  heatmap_url: string | null;
  bounding_box: BoundingBox | null;
  model_version: string;
  latency_seconds: number;
}

export interface ReviewData {
  decision: MedecinDecision;
  agrees_with_ai: boolean;
  modified_diagnosis?: string | null;
  notes: string;
  prescription?: string | null;
  medecin_name: string;
  reviewed_at: string | null;
}

export type ZoneType = "rural" | "periurbain" | "urbain";
export type HealthCoverage = "cnss" | "mutuelle" | "ramed" | "non_assure";

export interface ConsultationListItem {
  id: string;
  anonymous_patient_id: string;
  status: ConsultationStatus;
  symptoms: string;
  body_area?: string | null;
  ai_prediction?: string | null;
  ai_confidence?: number | null;
  ai_risk_level?: RiskLevel | null;
  image_url?: string | null;
  heatmap_url?: string | null;
  priority_score?: number | null;
  zone_type?: ZoneType | null;
  health_coverage?: HealthCoverage | null;
  created_at: string | null;
}

export type GeminiAssessment =
  | "benign"
  | "suspicious"
  | "atypical"
  | "unclear"
  | "non_lesion";

export interface GeminiResult {
  description: string;
  assessment: GeminiAssessment;
  concerns: string[];
  recommended_action: string;
  model: string;
}

export interface ConsultationDetail extends ConsultationListItem {
  symptoms_duration?: string | null;
  video_url?: string | null;
  ai_result: AIResult;
  gemini: GeminiResult | null;
  review: ReviewData | null;
}

export interface DashboardStats {
  total_consultations: number;
  pending_review: number;
  validated: number;
  escalated: number;
  concordance_ia_medecin: number;
  total_reviews: number;
}

export interface AuditLogEntry {
  id: number;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  timestamp: string | null;
}
