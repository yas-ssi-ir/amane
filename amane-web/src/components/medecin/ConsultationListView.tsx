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
import type { ConsultationListItem, HealthCoverage, RiskLevel, ZoneType } from "@/lib/types";

const RISK_STRIPE: Record<RiskLevel, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  MEDIUM: "#3b82f6",
  LOW: "#10b981",
};

import { RiskBadge } from "@/components/RiskBadge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export type FilterKind = "all" | "uncertain" | "critical";

interface FilterDef {
  value: FilterKind;
  label: string;
}

interface Props {
  /** Données + état React Query */
  data: ConsultationListItem[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;

  /** Header */
  eyebrow: string;
  eyebrowLive?: boolean;
  title: string;
  subtitle: string;

  /** Filtres optionnels (queue uniquement) */
  filters?: FilterDef[];
  defaultFilter?: FilterKind;

  /** Tri custom (queue trie par urgence, validated par date) */
  sortFn?: (a: ConsultationListItem, b: ConsultationListItem) => number;

  /** Empty states */
  emptyMessages: Record<FilterKind | "search", string>;

  /** Indicateur visuel "validé" sur chaque carte (validated page) */
  showValidatedIcon?: boolean;

  /** Active les filtres zone géographique et couverture santé */
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
  const [coverageFilter, setCoverageFilter] = useState<HealthCoverage | "all">("all");

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
        if (!(c.ai_risk_level === "CRITICAL" || c.ai_risk_level === "HIGH")) return false;
      }
      if (zoneFilter !== "all" && c.zone_type !== zoneFilter) return false;
      if (coverageFilter !== "all" && c.health_coverage !== coverageFilter) return false;
      return true;
    });

    if (sortFn) return [...filtered].sort(sortFn);
    return filtered;
  }, [data, filter, search, sortFn, zoneFilter, coverageFilter]);

  const accent = showValidatedIcon ? "emerald" : "emerald";
  const ringHover = showValidatedIcon
    ? "hover:border-emerald-500/30"
    : "hover:ring-2 hover:ring-emerald-500/20 hover:border-white/20";

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="flex items-start justify-between mb-8 gap-4 flex-wrap"
      >
        <div>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
            {eyebrowLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            {eyebrow}
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="text-zinc-400 mt-2 text-sm">{subtitle}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors"
        >
          <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
          Rafraîchir
        </button>
      </motion.div>

      {/* Filters + search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
        className="flex items-center gap-3 mb-3 flex-wrap"
      >
        {filters?.map((f) => (
          <FilterChip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
            {f.value === "all" && data ? ` (${data.length})` : ""}
          </FilterChip>
        ))}

        <div className={`${filters ? "ml-auto" : ""} relative w-full sm:w-72`}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher patient, symptômes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-500/40"
          />
        </div>
      </motion.div>

      {/* Zone + Coverage filters */}
      {showZoneCoverageFilters && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: easeOut }}
          className="flex items-center gap-3 mb-6 flex-wrap"
        >
          <FilterSelect
            value={zoneFilter}
            onChange={(v) => setZoneFilter(v as ZoneType | "all")}
            options={[
              { value: "all", label: "Toutes les zones" },
              { value: "rural", label: "🌾 Rural" },
              { value: "periurbain", label: "🏘️ Périurbain" },
              { value: "urbain", label: "🏙️ Urbain" },
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
              onClick={() => { setZoneFilter("all"); setCoverageFilter("all"); }}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              Réinitialiser
            </button>
          )}
          <span className="ml-auto text-xs text-zinc-500">
            {visible.length} résultat{visible.length > 1 ? "s" : ""}
          </span>
        </motion.div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          message={
            search
              ? emptyMessages.search
              : emptyMessages[filter] ?? emptyMessages.all
          }
          accentEmerald
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="space-y-3"
        >
          {visible.map((c) => (
            <ConsultationRow
              key={c.id}
              consultation={c}
              ringHover={ringHover}
              showValidatedIcon={showValidatedIcon}
              onClick={() => router.push(`/medecin/${c.id}`)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

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
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
          : "bg-white/[0.04] border border-white/10 text-zinc-300 hover:bg-white/[0.06] hover:border-white/20",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ConsultationRow({
  consultation: c,
  ringHover,
  showValidatedIcon,
  onClick,
}: {
  consultation: ConsultationListItem;
  ringHover: string;
  showValidatedIcon: boolean;
  onClick: () => void;
}) {
  const isUncertain = c.ai_confidence != null && c.ai_confidence < 0.66;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
      }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      className={`group relative cursor-pointer rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] ${ringHover} transition-all overflow-hidden`}
    >
      {/* Bande colorée risque */}
      {c.ai_risk_level && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 opacity-70"
          style={{ backgroundColor: RISK_STRIPE[c.ai_risk_level as RiskLevel] }}
        />
      )}
      <div className="flex items-center gap-4 p-4 pl-5">
        <div className="relative w-20 h-20 rounded-xl bg-zinc-900 overflow-hidden flex-shrink-0 ring-1 ring-white/10">
          {c.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={absoluteUrl(c.image_url)} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {showValidatedIcon && <CheckCircle2 size={14} className="text-emerald-400" />}
            <span className="font-semibold text-zinc-100 text-sm truncate">
              {c.ai_prediction ?? "Analyse en cours..."}
            </span>
            <RiskBadge level={c.ai_risk_level} isUncertain={isUncertain && !showValidatedIcon} size="sm" />
            {c.ai_confidence != null && (
              <span className="text-xs text-zinc-500 tabular-nums">
                {Math.round(c.ai_confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm line-clamp-1">{c.symptoms}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
            <span className="font-mono">{c.anonymous_patient_id}</span>
            {c.body_area && <span>· {c.body_area}</span>}
            {c.created_at && (
              <span>
                ·{" "}
                {formatDistanceToNow(new Date(c.created_at), { locale: fr, addSuffix: true })}
              </span>
            )}
          </div>
          {c.ai_confidence != null && c.ai_risk_level && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-24 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full opacity-70"
                  style={{
                    width: `${Math.round(c.ai_confidence * 100)}%`,
                    backgroundColor: RISK_STRIPE[c.ai_risk_level as RiskLevel],
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
        "rounded-full px-3 py-1.5 text-sm font-medium transition-all appearance-none cursor-pointer pr-6",
        "border bg-white/[0.04] text-zinc-300",
        active
          ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.06]",
      ].join(" ")}
      style={{ backgroundImage: "none" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-zinc-900 text-zinc-100">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ message, accentEmerald }: { message: string; accentEmerald?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-16 flex flex-col items-center text-center"
    >
      <div
        className={`relative w-20 h-20 rounded-2xl flex items-center justify-center mb-5 border ${
          accentEmerald
            ? "bg-emerald-500/10 ring-1 ring-emerald-500/20 border-emerald-500/20"
            : "bg-white/[0.04] border-white/10"
        }`}
      >
        <Inbox size={32} className={accentEmerald ? "text-emerald-400" : "text-zinc-500"} />
        {accentEmerald && (
          <Sparkles size={14} className="absolute -top-1 -right-1 text-emerald-300" />
        )}
      </div>
      <p className="text-zinc-100 font-semibold text-lg">{message}</p>
      <p className="text-zinc-500 text-sm mt-2 max-w-sm">
        Cette page se rafraîchit automatiquement toutes les 15 secondes.
      </p>
    </motion.div>
  );
}
