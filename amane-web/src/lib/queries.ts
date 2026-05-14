"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { consultationsApi, dashboardApi } from "./api";
import type { ConsultationStatus, MedecinDecision } from "./types";

export const consultationsKeys = {
  all: ["consultations"] as const,
  list: (status?: ConsultationStatus) => [...consultationsKeys.all, "list", status ?? "all"] as const,
  detail: (id: string) => [...consultationsKeys.all, "detail", id] as const,
};

export function useConsultations(status?: ConsultationStatus) {
  return useQuery({
    queryKey: consultationsKeys.list(status),
    queryFn: () => consultationsApi.list(status),
    refetchInterval: 15_000, // polling auto pour temps-reel demo
  });
}

export function useConsultation(id: string | undefined) {
  return useQuery({
    queryKey: consultationsKeys.detail(id ?? ""),
    queryFn: () => consultationsApi.get(id!),
    enabled: !!id,
  });
}

export function useReviewConsultation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      decision: MedecinDecision;
      agrees_with_ai: boolean;
      modified_diagnosis?: string;
      notes: string;
      prescription?: string;
    }) => consultationsApi.review(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationsKeys.all });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.stats(),
    refetchInterval: 30_000,
  });
}

export function useAuditLog(limit = 50) {
  return useQuery({
    queryKey: ["dashboard", "audit", limit],
    queryFn: () => dashboardApi.auditLog(limit),
    refetchInterval: 30_000,
  });
}
