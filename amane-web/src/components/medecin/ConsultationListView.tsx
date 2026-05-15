"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Inbox,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { absoluteUrl } from "@/lib/api";
import type {
  ConsultationListItem,
  HealthCoverage,
  RiskLevel,
  ZoneType,
} from "@/lib/types";

import { RiskBadge } from "@/components/RiskBadge";
import { Skeleton } from "@/components/ui/skeleton";

const RISK_STRIPE: Record<RiskLevel, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  MEDIUM: "#3b82f6",
  LOW: "#10b981",
};

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export type FilterKind = "all" | "uncertain" | "critical";

interface FilterDef {
  value: FilterKind;
  label: string;
}

interface Props {
  data: ConsultationListItem[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;

  eyebrow: string;
  eyebrowLive?: boolean;
  title: string;
  subtitle: string;

  filters?: FilterDef[];
  defaultFilter?: FilterKind;

  sortFn?: (a: ConsultationListItem, b: ConsultationListItem) => number;

  emptyMessages: Record<FilterKind | "search", string>;

  showValidatedIcon?: boolean;
  showZoneCoverageFilters?: boolean;
}

export function ConsultationListView({
  data,
  isLoading,
  isRefetching,
  refetch,
  eyebrow,
  eyebrowLive = false,
  title,
  subtitle,
  filters,
  defaultFilter = "all",
  sortFn,
  emptyMessages,
  showValidatedIcon = false,
  showZoneCoverageFilters = false,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKind>(defaultFilter);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<ZoneType | "all">("all");
  const [coverageFilter, setCoverageFilter] = useState<HealthCoverage | "all">(
    "all",
  );

  const visible = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter((c) => {
      if (search) {
        const s = search.toLowerCase();
        const hits =
          c.symptoms?.toLowerCase().includes(s) ||
          c.body_area?.toLowerCase().includes(s) ||
          c.ai_prediction?.toLowerCase().includes(s) ||
          c.anonymous_patient_id.toLowerCase().includes(s);
        if (!hits) return false;
      }
      if (filter === "uncertain") {
        if (!(c.ai_confidence != null && c.ai_confidence < 0.66)) return false;
      }
      if (filter === "critical") {
        if (!(c.ai_risk_level === "CRITICAL" || c.ai_risk_level === "HIGH"))
          return false;
      }
      if (zoneFilter !== "all" && c.zone_type !== zoneFilter) return false;
      if (coverageFilter !== "all" && c.health_coverage !== coverageFilter)
        return false;
      return true;
    });
    if (sortFn) return [...filtered].sort(sortFn);
    return filtered;
  }, [data, filter, search, sortFn, zoneFilter, coverageFilter]);

  // Critical count for the alert ribbon
  const criticalCount = useMemo(
    () =>
      (data ?? []).filter(
        (c) => c.ai_risk_level === "CRITICAL" || c.ai_risk_level === "HIGH",
      ).length,
    [data],
  );

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl">
      {/* ============= Header ============= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="flex items-start justify-between mb-8 gap-4 flex-wrap"
      >
        <div className="space-y-2">
          <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.18em] flex items-center gap-2">
            {eyebrowLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            {eyebrow}
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.1]">
            {title}
            <span className="text-emerald-400">.</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!showValidatedIcon && criticalCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 ring-1 ring-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
              </span>
              {criticalCount} urgent{criticalCount > 1 ? "s" : ""}
            </span>
          )}
          <motion.button
            onClick={() => refetch()}
            disabled={isRefetching}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="inline-flex items-center gap-2 rounded-full ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-all"
          >
            <RefreshCw
              size={14}
              className={isRefetching ? "animate-spin" : ""}
            />
            Rafraîchir
          </motion.button>
        </div>
      </motion.div>

      {/* ============= Filters + search ============= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
        className="flex items-center gap-2.5 mb-3 flex-wrap"
      >
        {filters?.map((f) => (
          <FilterChip
            key={f.value}
            active={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value === "all" && data ? ` (${data.length})` : ""}
          </FilterChip>
        ))}

        <div className={`${filters ? "ml-auto" : ""} relative w-full sm:w-72`}>
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <div className="rounded-full bg-white/[0.04] ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all">
            <input
              placeholder="Rechercher patient, symptômes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 pl-9 pr-4 py-2 text-sm rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* ============= Zone + Coverage filters ============= */}
      {showZoneCoverageFilters && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: easeOut }}
          className="flex items-center gap-2.5 mb-6 flex-wrap"
        >
          <FilterSelect
            value={zoneFilter}
            onChange={(v) => setZoneFilter(v as ZoneType | "all")}
            options={[
              { value: "all", label: "Toutes les zones" },
              { value: "rural", label: "Rural" },
              { value: "periurbain", label: "Périurbain" },
              { value: "urbain", label: "Urbain" },
            ]}
          />
          <FilterSelect
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
          {(zoneFilter !== "all" || coverageFilter !== "all") && (
            <button
              onClick={() => {
                setZoneFilter("all");
                setCoverageFilter("all");
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              Réinitialiser
            </button>
          )}
          <span className="ml-auto text-xs text-zinc-500 tabular-nums">
            {visible.length} résultat{visible.length > 1 ? "s" : ""}
          </span>
        </motion.div>
      )}

      {/* ============= List ============= */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-28 w-full rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          message={
            search
              ? emptyMessages.search
              : (emptyMessages[filter] ?? emptyMessages.all)
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
          className="space-y-3"
        >
          {visible.map((c) => (
            <ConsultationRow
              key={c.id}
              consultation={c}
              showValidatedIcon={showValidatedIcon}
              onClick={() => router.push(`/medecin/${c.id}`)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={[
        "rounded-full px-4 py-1.5 text-sm font-medium transition-all ring-1",
        active
          ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40 shadow-md shadow-emerald-500/10"
          : "bg-white/[0.04] ring-white/10 text-zinc-300 hover:ring-white/20 hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

function ConsultationRow({
  consultation: c,
  showValidatedIcon,
  onClick,
}: {
  consultation: ConsultationListItem;
  showValidatedIcon: boolean;
  onClick: () => void;
}) {
  const isUncertain = c.ai_confidence != null && c.ai_confidence < 0.66;
  const isCritical = c.ai_risk_level === "CRITICAL";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: easeOut },
        },
      }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      className={[
        "group relative cursor-pointer rounded-2xl ring-1 ring-white/10 bg-zinc-900/30 hover:bg-white/[0.04] hover:ring-white/20 transition-all overflow-hidden backdrop-blur-sm",
        isCritical &&
          !showValidatedIcon &&
          "hover:ring-rose-500/40 hover:shadow-lg hover:shadow-rose-500/10",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Risk stripe with glow for critical */}
      {c.ai_risk_level && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isCritical && !showValidatedIcon
              ? "opacity-90 shadow-[0_0_8px_currentColor]"
              : "opacity-70"
          }`}
          style={{ backgroundColor: RISK_STRIPE[c.ai_risk_level as RiskLevel] }}
        />
      )}

      {/* Hover gradient flood */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center gap-4 p-4 pl-5">
        <div className="relative w-20 h-20 rounded-xl bg-zinc-900 overflow-hidden flex-shrink-0 ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
          {c.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={absoluteUrl(c.image_url)}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {showValidatedIcon && (
              <CheckCircle2
                size={14}
                className="text-emerald-400"
                strokeWidth={2.5}
              />
            )}
            <span className="font-semibold text-zinc-100 text-sm truncate tracking-tight">
              {c.ai_prediction ?? "Analyse en cours…"}
            </span>
            <RiskBadge
              level={c.ai_risk_level}
              isUncertain={isUncertain && !showValidatedIcon}
              size="sm"
              glow={isCritical && !showValidatedIcon}
            />
            {c.ai_confidence != null && (
              <span className="text-xs text-zinc-500 tabular-nums">
                {Math.round(c.ai_confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm line-clamp-1 leading-relaxed">
            {c.symptoms}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 flex-wrap">
            <span className="font-mono inline-block rounded bg-white/[0.04] ring-1 ring-white/[0.06] px-1.5 py-0.5 text-[10px]">
              {c.anonymous_patient_id}
            </span>
            {c.body_area && (
              <span className="inline-flex items-center gap-1">
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-600" />
                {c.body_area}
              </span>
            )}
            {c.created_at && (
              <span className="inline-flex items-center gap-1">
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-600" />
                {formatDistanceToNow(new Date(c.created_at), {
                  locale: fr,
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
          {c.ai_confidence != null && c.ai_risk_level && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-32 h-1 bg-white/[0.06] rounded-full overflow-hidden ring-1 ring-white/[0.04]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(c.ai_confidence * 100)}%`,
                    backgroundColor: RISK_STRIPE[c.ai_risk_level as RiskLevel],
                    opacity: 0.85,
                    boxShadow: isCritical
                      ? `0 0 6px ${RISK_STRIPE[c.ai_risk_level as RiskLevel]}`
                      : "none",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <ChevronRight
          size={20}
          className="text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0"
        />
      </div>
    </motion.div>
  );
}

function FilterSelect({
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
        "rounded-full px-3 py-1.5 text-xs font-medium transition-all appearance-none cursor-pointer pr-6",
        "ring-1 bg-white/[0.04] text-zinc-300",
        active
          ? "ring-emerald-500/40 text-emerald-300 bg-emerald-500/10"
          : "ring-white/10 hover:ring-white/20 hover:bg-white/[0.06]",
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

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="relative rounded-2xl ring-1 ring-white/10 bg-zinc-900/30 p-16 flex flex-col items-center text-center overflow-hidden backdrop-blur-sm"
    >
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full blur-3xl bg-emerald-500/10 pointer-events-none"
      />
      <div className="relative w-20 h-20 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10">
        <Inbox size={28} className="text-emerald-300" strokeWidth={2.2} />
        <Sparkles
          size={14}
          className="absolute -top-1.5 -right-1.5 text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]"
          strokeWidth={2.5}
        />
      </div>
      <p className="text-zinc-100 font-semibold text-lg tracking-tight relative">
        {message}
      </p>
      <p className="text-zinc-500 text-sm mt-2 max-w-sm leading-relaxed relative">
        Cette page se rafraîchit automatiquement toutes les 15 secondes.
      </p>
    </motion.div>
  );
}
