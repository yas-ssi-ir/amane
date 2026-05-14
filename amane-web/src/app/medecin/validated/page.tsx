"use client";

import { useConsultations } from "@/lib/queries";

import { ConsultationListView } from "@/components/medecin/ConsultationListView";

export default function ValidatedPage() {
  const { data, isLoading, refetch, isRefetching } = useConsultations("validated");

  return (
    <ConsultationListView
      data={data}
      isLoading={isLoading}
      isRefetching={isRefetching}
      refetch={refetch}
      eyebrow="Décisions enregistrées"
      title="Cas validés"
      subtitle="Vos décisions enregistrées et notifiées au terrain."
      sortFn={(a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      }
      emptyMessages={{
        all: "Aucun cas validé pour le moment",
        uncertain: "Aucun cas validé incertain",
        critical: "Aucun cas validé à risque élevé",
        search: "Aucun résultat",
      }}
      showValidatedIcon
      showZoneCoverageFilters
    />
  );
}
