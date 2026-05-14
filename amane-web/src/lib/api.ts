/**
 * Client HTTP pour le backend FastAPI.
 * - Lit l'URL depuis NEXT_PUBLIC_API_URL (.env.local)
 * - Injecte JWT via setAuthHandlers (decouple de auth-store)
 * - 401 -> onUnauthorized -> auth-store logout
 */

import axios, { AxiosError } from "axios";

import type {
  AuditLogEntry,
  ConsultationDetail,
  ConsultationListItem,
  ConsultationStatus,
  DashboardStats,
  LoginResponse,
  MedecinDecision,
  PendingVerificationUser,
  User,
} from "./types";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function setAuthHandlers(handlers: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}) {
  getToken = handlers.getToken;
  onUnauthorized = handlers.onUnauthorized;
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ detail?: string }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail ?? error.message;
    if (status === 401) onUnauthorized();
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    const enhanced = new Error(message);
    (enhanced as { status?: number }).status = status;
    return Promise.reject(enhanced);
  }
);

// =============== Endpoints ===============
export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>("/api/auth/login", { username, password }).then((r) => r.data),
  me: () => api.get<User>("/api/auth/me").then((r) => r.data),
  myStats: () => api.get<Record<string, unknown>>("/api/auth/me/stats").then((r) => r.data),
  changePassword: (current_password: string, new_password: string) =>
    api.patch("/api/auth/password", { current_password, new_password }).then((r) => r.data),
};

export const consultationsApi = {
  list: (status?: ConsultationStatus) =>
    api.get<ConsultationListItem[]>("/api/consultations", {
      params: status ? { status } : undefined,
    }).then((r) => r.data),
  get: (id: string) =>
    api.get<ConsultationDetail>(`/api/consultations/${id}`).then((r) => r.data),
  review: (id: string, payload: {
    decision: MedecinDecision;
    agrees_with_ai: boolean;
    modified_diagnosis?: string;
    notes: string;
    prescription?: string;
  }) => api.post(`/api/consultations/${id}/review`, payload).then((r) => r.data),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/api/dashboard/stats").then((r) => r.data),
  auditLog: (limit = 50) =>
    api.get<AuditLogEntry[]>("/api/dashboard/audit-log", { params: { limit } }).then((r) => r.data),
};

export const adminApi = {
  pendingVerifications: (status = "pending") =>
    api.get<PendingVerificationUser[]>("/api/admin/verifications", { params: { status } }).then((r) => r.data),
  verifyUser: (userId: string, status: "approved" | "rejected", notes?: string) =>
    api.post(`/api/admin/users/${userId}/verify`, { status, notes }).then((r) => r.data),
  createUser: (data: {
    username: string; password: string; full_name: string;
    role: "relais" | "infirmier" | "medecin" | "admin";
    phone?: string; region?: string; speciality?: string;
  }) => api.post("/api/admin/users", data).then((r) => r.data),
};

export const absoluteUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};
