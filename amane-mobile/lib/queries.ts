/**
 * Hooks React Query pour les consultations.
 * Cache automatique, refetch au focus, invalidation apres mutation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { consultationsApi } from './api';
import type { ConsultationStatus } from './types';

export const consultationsKeys = {
  all: ['consultations'] as const,
  list: (status?: ConsultationStatus) =>
    [...consultationsKeys.all, 'list', status ?? 'all'] as const,
  detail: (id: string) => [...consultationsKeys.all, 'detail', id] as const,
};

export function useConsultations(status?: ConsultationStatus) {
  return useQuery({
    queryKey: consultationsKeys.list(status),
    queryFn: () => consultationsApi.list(status),
    // Polling 30s : nouvelle decision medecin apparaît sans recharger
    refetchInterval: 30_000,
  });
}

export function useConsultation(id: string | undefined) {
  return useQuery({
    queryKey: consultationsKeys.detail(id ?? ''),
    queryFn: () => consultationsApi.get(id!),
    enabled: !!id,
    // Polling 20s : si le medecin valide pendant que le relais regarde
    // le resultat, la decision apparaît automatiquement.
    refetchInterval: 20_000,
  });
}

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => consultationsApi.create(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationsKeys.all });
    },
  });
}
