"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Heart,
  Map as MapIcon,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { HealthCoverage, ZoneType } from "@/lib/types";

import { CaravanePanel } from "@/components/admin/CaravanePanel";
import { ConcordanceHero } from "@/components/admin/ConcordanceHero";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { KpiCard } from "@/components/admin/KpiCard";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { REGION_BY_PREFIX, easeOut } from "@/components/admin/constants";
import { RiskDonut } from "@/components/admin/RiskDonut";
import { TopDiagnoses } from "@/components/admin/TopDiagnoses";
import { VerificationsPanel } from "@/components/admin/VerificationsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLog, useConsultations, useDashboardStats } from "@/lib/queries";

const MoroccoMap = dynamic(() => import("@/components/MoroccoMap"), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-80 rounded-2xl bg-white/[0.04]" />
  ),
});

function AdminFilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== "all";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-medium transition-all appearance-none cursor-pointer pr-6 ring-1",
        active
          ? "ring-violet-500/40 text-violet-300 bg-violet-500/10"
          : "ring-white/10 text-zinc-300 bg-white/[0.04] hover:ring-white/20 hover:bg-white/[0.06]",
      ].join(" ")}
      style={{ backgroundImage: "none" }}
    >
      {options.map((o) => (
        <option
          key={o.value}
          value={o.value}
          className="bg-zinc-900 text-zinc-100"
        >
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function AdminDashboardPage() {
  const stats = useDashboardStats();
  const consultations = useConsultations();
  const audit = useAuditLog(10);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [zoneFilter, setZoneFilter] = useState<ZoneType | "all">("all");
  const [coverageFilter, setCoverageFilter] = useState<HealthCoverage | "all">(
    "all",
  );

  const filteredConsultations = useMemo(() => {
    if (!consultations.data) return [];
    return consultations.data.filter((c) => {
      if (zoneFilter !== "all" && c.zone_type !== zoneFilter) return false;
      if (coverageFilter !== "all" && c.health_coverage !== coverageFilter)
        return false;
      return true;
    });
  }, [consultations.data, zoneFilter, coverageFilter]);

  const regionStats = useMemo(() => {
    const map = new Map<
      string,
      { count: number; urgent: number; priorityScores: number[] }
    >();
    filteredConsultations.forEach((c) => {
      const prefix = c.anonymous_patient_id?.slice(0, 3).toUpperCase() ?? "";
      const region = REGION_BY_PREFIX[prefix] ?? "Casablanca-Settat";
      const cur = map.get(region) ?? {
        count: 0,
        urgent: 0,
        priorityScores: [],
      };
      cur.count++;
      if (c.ai_risk_level === "CRITICAL" || c.ai_risk_level === "HIGH")
        cur.urgent++;
      if (c.priority_score != null) cur.priorityScores.push(c.priority_score);
      map.set(region, cur);
    });
    return map;
  }, [filteredConsultations]);

  const isLoading = stats.isLoading || consultations.isLoading;
  const hasFilter = zoneFilter !== "all" || coverageFilter !== "all";

  return (
    <div className="px-6 lg:px-10 py-8 max-w-7xl">
      {createUserOpen && (
        <CreateUserModal onClose={() => setCreateUserOpen(false)} />
      )}

      {/* ============= Header ============= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="flex items-start justify-between mb-8 gap-4 flex-wrap"
      >
        <div className="space-y-2">
          <p className="text-violet-400 text-[10px] font-semibold uppercase tracking-[0.18em] flex items-center gap-1.5">
            <span className="w-3 h-px bg-violet-400" />
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.1]">
            Vue d&apos;ensemble<span className="text-violet-400">.</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm max-w-xl leading-relaxed">
            État de l&apos;infrastructure AMANE en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30 px-3 py-1.5 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
          <motion.button
            onClick={() => {
              stats.refetch();
              consultations.refetch();
              audit.refetch();
            }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="text-zinc-400 hover:text-zinc-100 p-2 rounded-full hover:bg-white/[0.06] ring-1 ring-transparent hover:ring-white/10 transition-all"
            aria-label="Rafraîchir"
          >
            <RefreshCw
              size={14}
              className={stats.isRefetching ? "animate-spin" : ""}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* ============= KPI bento grid ============= */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.07 } },
        }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-36 rounded-2xl bg-white/[0.04]"
            />
          ))
        ) : (
          <>
            <KpiCard
              icon={<ClipboardList size={20} strokeWidth={2.2} />}
              label="Consultations totales"
              value={stats.data?.total_consultations ?? 0}
              accent="blue"
            />
            <KpiCard
              icon={<AlertTriangle size={20} strokeWidth={2.2} />}
              label="En attente du médecin"
              value={stats.data?.pending_review ?? 0}
              accent="amber"
              subtext={
                stats.data?.pending_review === 0
                  ? "Tout est traité"
                  : `${stats.data?.pending_review} en attente`
              }
            />
            <KpiCard
              icon={<CheckCircle2 size={20} strokeWidth={2.2} />}
              label="Validées"
              value={stats.data?.validated ?? 0}
              accent="emerald"
            />
            <KpiCard
              icon={<Heart size={20} strokeWidth={2.2} />}
              label="Urgences escaladées"
              value={stats.data?.escalated ?? 0}
              accent="rose"
              subtext={
                (stats.data?.escalated ?? 0) > 0
                  ? "Cas critiques"
                  : "Aucun"
              }
            />
          </>
        )}
      </motion.div>

      {/* ============= Concordance hero ============= */}
      <ConcordanceHero
        concordance={stats.data?.concordance_ia_medecin ?? 0}
        totalReviews={stats.data?.total_reviews ?? 0}
        isLoading={isLoading}
      />

      {/* ============= Filters bar ============= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: easeOut }}
        className="flex items-center gap-2.5 mb-4 flex-wrap rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06] px-4 py-2.5"
      >
        <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-[0.16em] flex items-center gap-1.5">
          <SlidersHorizontal size={11} strokeWidth={2.4} />
          Filtres
        </span>
        <AdminFilterSelect
          value={zoneFilter}
          onChange={(v) => setZoneFilter(v as ZoneType | "all")}
          options={[
            { value: "all", label: "Toutes les zones" },
            { value: "rural", label: "Rural" },
            { value: "periurbain", label: "Périurbain" },
            { value: "urbain", label: "Urbain" },
          ]}
        />
        <AdminFilterSelect
          value={coverageFilter}
          onChange={(v) => setCoverageFilter(v as HealthCoverage | "all")}
          options={[
            { value: "all", label: "Toutes les couvertures" },
            { value: "cnss", label: "CNSS" },
            { value: "mutuelle", label: "Mutuelle" },
            { value: "ramed", label: "RAMED" },
            { value: "non_assure", label: "Non assuré" },
          ]}
        />
        {hasFilter && (
          <>
            <button
              onClick={() => {
                setZoneFilter("all");
                setCoverageFilter("all");
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              Réinitialiser
            </button>
            <span className="ml-auto text-[11px] text-violet-300 font-semibold tabular-nums">
              {filteredConsultations.length} / {consultations.data?.length ?? 0}{" "}
              consultations
            </span>
          </>
        )}
      </motion.div>

      {/* ============= Charts grid ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RiskDonut
          consultations={filteredConsultations}
          isLoading={consultations.isLoading}
        />
        <TopDiagnoses
          consultations={filteredConsultations}
          isLoading={consultations.isLoading}
        />
      </div>

      {/* ============= Map ============= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
        className="relative rounded-2xl ring-1 ring-white/10 bg-zinc-900/40 overflow-hidden mb-6 backdrop-blur-md"
      >
        <div
          aria-hidden
          className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent"
        />
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30 flex items-center justify-center">
              <MapIcon
                size={14}
                className="text-violet-300"
                strokeWidth={2.4}
              />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 leading-tight">
                Répartition géographique
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {regionStats.size} / 12 régions actives
              </p>
            </div>
          </div>
          <Link
            href="/admin/map"
            className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200 rounded-full px-3 py-1.5 ring-1 ring-violet-500/20 hover:ring-violet-500/40 hover:bg-violet-500/10 transition-all"
          >
            Vue détaillée
          </Link>
        </div>
        {consultations.isLoading ? (
          <Skeleton className="h-80 bg-white/[0.04]" />
        ) : (
          <MoroccoMap regionStats={regionStats} height={320} zoom={5} />
        )}
      </motion.div>

      {/* ============= Caravanes médicales ============= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: easeOut }}
        className="mb-6"
      >
        <CaravanePanel
          regionStats={regionStats}
          isLoading={consultations.isLoading}
        />
      </motion.div>

      {/* ============= Verifications ============= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: easeOut }}
        className="mb-6"
      >
        <VerificationsPanel onCreateUser={() => setCreateUserOpen(true)} />
      </motion.div>

      {/* ============= Recent activity ============= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
      >
        <RecentActivity data={audit.data} isLoading={audit.isLoading} />
      </motion.div>
    </div>
  );
}
