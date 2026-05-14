"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Globe, MapPin } from "lucide-react";
import { useMemo } from "react";

import { useConsultations } from "@/lib/queries";

import { Skeleton } from "@/components/ui/skeleton";

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

const MoroccoMap = dynamic(() => import("@/components/MoroccoMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] rounded-2xl bg-white/[0.04]" />,
});

export const REGIONS_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  "Tanger-Tetouan-Al Hoceima": { lat: 35.5, lng: -5.4, name: "Tanger-Tétouan-Al Hoceïma" },
  "Oriental": { lat: 34.7, lng: -2.5, name: "Oriental" },
  "Fes-Meknes": { lat: 34.0, lng: -4.9, name: "Fès-Meknès" },
  "Rabat-Sale-Kenitra": { lat: 34.0, lng: -6.5, name: "Rabat-Salé-Kénitra" },
  "Beni Mellal-Khenifra": { lat: 32.5, lng: -6.4, name: "Béni Mellal-Khénifra" },
  "Casablanca-Settat": { lat: 33.5, lng: -7.5, name: "Casablanca-Settat" },
  "Marrakech-Safi": { lat: 31.6, lng: -8.0, name: "Marrakech-Safi" },
  "Draa-Tafilalet": { lat: 31.5, lng: -4.5, name: "Drâa-Tafilalet" },
  "Souss-Massa": { lat: 30.4, lng: -9.5, name: "Souss-Massa" },
  "Guelmim-Oued Noun": { lat: 28.5, lng: -10.0, name: "Guelmim-Oued Noun" },
  "Laayoune-Sakia El Hamra": { lat: 27.1, lng: -13.2, name: "Laâyoune-Sakia El Hamra" },
  "Dakhla-Oued Ed-Dahab": { lat: 23.7, lng: -15.9, name: "Dakhla-Oued Ed-Dahab" },
};

const REGION_BY_PREFIX: Record<string, string> = {
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

export default function MapPage() {
  const { data, isLoading } = useConsultations();

  const regionStats = useMemo(() => {
    if (!data) return new Map<string, { count: number; urgent: number }>();
    const stats = new Map<string, { count: number; urgent: number }>();
    data.forEach((c) => {
      const prefix = c.anonymous_patient_id?.slice(0, 3).toUpperCase() ?? "";
      const region = REGION_BY_PREFIX[prefix] ?? "Casablanca-Settat";
      const cur = stats.get(region) ?? { count: 0, urgent: 0 };
      cur.count++;
      if (c.ai_risk_level === "CRITICAL" || c.ai_risk_level === "HIGH") cur.urgent++;
      stats.set(region, cur);
    });
    return stats;
  }, [data]);

  const totalRegions = regionStats.size;
  const totalCases = data?.length ?? 0;
  const totalUrgent = Array.from(regionStats.values()).reduce((s, r) => s + r.urgent, 0);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="mb-6"
      >
        <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">
          Géolocalisation
        </p>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
          Carte du Maroc
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          Répartition géographique des consultations par région.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SmallStat
          icon={<Globe size={18} className="text-violet-300" />}
          label="Régions actives"
          value={`${totalRegions} / 12`}
          delay={0.1}
        />
        <SmallStat
          icon={<MapPin size={18} className="text-emerald-300" />}
          label="Consultations totales"
          value={String(totalCases)}
          delay={0.15}
        />
        <SmallStat
          icon={<MapPin size={18} className="text-rose-300" />}
          label="Cas urgents (HIGH/CRITICAL)"
          value={String(totalUrgent)}
          delay={0.2}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: easeOut }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
      >
        {isLoading ? (
          <Skeleton className="h-[600px] bg-white/[0.04]" />
        ) : (
          <MoroccoMap regionStats={regionStats} />
        )}
      </motion.div>

      <p className="text-xs text-zinc-500 mt-6 text-center">
        La taille des cercles est proportionnelle au nombre de consultations.
        Les cercles rouges signalent des régions avec des cas à haut risque.
      </p>
    </div>
  );
}

function SmallStat({
  icon, label, value, delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: easeOut }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-zinc-100">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </motion.div>
  );
}
