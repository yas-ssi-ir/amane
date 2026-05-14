import type { RiskLevel } from "@/lib/types";

export const REGION_BY_PREFIX: Record<string, string> = {
  TAN: "Tanger-Tetouan-Al Hoceima",
  ORI: "Oriental",
  FES: "Fes-Meknes",
  RAB: "Rabat-Sale-Kenitra",
  BEN: "Beni Mellal-Khenifra",
  CAS: "Casablanca-Settat",
  MAR: "Marrakech-Safi",
  DRA: "Draa-Tafilalet",
  SOU: "Souss-Massa",
  GUE: "Guelmim-Oued Noun",
  LAA: "Laayoune-Sakia El Hamra",
  DAK: "Dakhla-Oued Ed-Dahab",
};

export const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#10b981",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  CRITICAL: "#f43f5e",
};

export const RISK_LABELS_MAP: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Modéré",
  HIGH: "Élevé",
  CRITICAL: "Critique",
};

export const ACTION_LABELS: Record<string, string> = {
  REGISTER: "Inscription",
  LOGIN: "Connexion",
  UPLOAD_AND_ANALYZE: "Consultation",
  REVIEW_DECISION: "Décision médecin",
  AUDIT_PURGE: "Purge audit",
};
