"use client";

import { useConsultations } from "@/lib/queries";
import type { ConsultationListItem } from "@/lib/types";

import { ConsultationListView } from "@/components/medecin/ConsultationListView";

/** Tri par priorité : incertains > critique > élevé > modéré > faible, puis date asc */
function sortByPriority(a: ConsultationListItem, b: ConsultationListItem): number {
  const score = (c: ConsultationListItem) => {
    let s = 0;
    if (c.ai_confidence != null && c.ai_confidence < 0.66) s += 100;
    if (c.ai_risk_level === "CRITICAL") s += 50;
    else if (c.ai_risk_level === "HIGH") s += 30;
    else if (c.ai_risk_level === "MEDIUM") s += 10;
    return s;
  };
  const sa = score(a);
  const sb = score(b);
  if (sa !== sb) return sb - sa;
  return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
}

export default function MedecinQueuePage() {
  const { data, isLoading, refetch, isRefetching } = useConsultations("ai_analyzed");

  return (
    <ConsultationListView
      data={data}
      isLoading={isLoading}
      isRefetching={isRefetching}
      refetch={refetch}
      eyebrow="Live · auto-refresh 15s"
      eyebrowLive
      title="File d'attente"
      subtitle="Cas remontés du terrain en attente de votre validation."
      filters={[
        { value: "all", label: "Tous" },
        { value: "uncertain", label: "IA incertaine" },
        { value: "critical", label: "Risque élevé" },
      ]}
      sortFn={sortByPriority}
      emptyMessages={{
        all: "Aucun cas en attente. Tout est validé !",
        uncertain: "Aucun cas avec faible confiance IA.",
        critical: "Aucun cas à risque élevé.",
        search: "Aucun résultat",
      }}
      showZoneCoverageFilters
    />
  );
}
