/**
 * Client HTTP pour le backend FastAPI.
 *
 * Decouple de auth-store via un pattern "setter" : auth-store enregistre
 * `getToken` et `onUnauthorized` au chargement, ce qui evite l'import
 * circulaire (api.ts importait auth-store qui importait api.ts).
 */

import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn(
    '[api] EXPO_PUBLIC_API_URL non defini -> fallback sur localhost. ' +
    'Cree un fichier .env a la racine de amane-mobile/ avec ' +
    'EXPO_PUBLIC_API_URL=http://192.168.X.X:8000'
  );
}

// =============== Hooks d'auth (registres par auth-store.ts) ===============
let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function setAuthHandlers(handlers: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}) {
  getToken = handlers.getToken;
  onUnauthorized = handlers.onUnauthorized;
}

// =============== Client axios ===============
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail ?? error.message;

    if (status === 401) {
      onUnauthorized();
    }

    const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    const enhanced = new Error(message);
    (enhanced as any).status = status;
    return Promise.reject(enhanced);
  }
);

// =============== Endpoints types ===============
import type {
  LoginResponse,
  ConsultationListItem,
  ConsultationDetail,
  ConsultationCreateResponse,
  ConsultationStatus,
  User,
} from './types';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { username, password }).then((r) => r.data),

  me: () =>
    api.get<User>('/api/auth/me').then((r) => r.data),

  register: (data: {
    username: string;
    password: string;
    full_name: string;
    role: string;
    region?: string;
    speciality?: string;
    phone?: string;
    credential_number?: string;
  }) => api.post('/api/auth/register', data).then((r) => r.data),
};

export const consultationsApi = {
  list: (status?: ConsultationStatus) =>
    api
      .get<ConsultationListItem[]>('/api/consultations', {
        params: status ? { status } : undefined,
      })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<ConsultationDetail>(`/api/consultations/${id}`).then((r) => r.data),

  create: (formData: FormData) =>
    api
      .post<ConsultationCreateResponse>('/api/consultations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
};

export const chatApi = {
  send: (messages: { role: 'user' | 'assistant'; content: string }[], message: string) =>
    api.post<{ reply: string }>('/api/chat', { messages, message }).then((r) => r.data),
};

export const absoluteUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};
