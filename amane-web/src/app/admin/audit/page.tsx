"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { RefreshCw, ScrollText, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuditLog } from "@/lib/queries";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ACTION_COLORS: Record<string, string> = {
  REGISTER: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  LOGIN: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  UPLOAD_AND_ANALYZE: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  REVIEW_DECISION: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  AUDIT_PURGE: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

const ROLE_COLORS: Record<string, string> = {
  relais: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
  infirmier: "bg-teal-500/10 text-teal-300 border-teal-500/30",
  medecin: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  admin: "bg-violet-500/10 text-violet-300 border-violet-500/30",
};

export default function AuditPage() {
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const { data, isLoading, refetch, isRefetching } = useAuditLog(limit);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((log) => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          log.action?.toLowerCase().includes(s) ||
          log.actor_id?.toLowerCase().includes(s) ||
          log.actor_role?.toLowerCase().includes(s) ||
          log.resource_type?.toLowerCase().includes(s) ||
          log.resource_id?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [data, search, actionFilter]);

  const actionCounts = useMemo(() => {
    const c = new Map<string, number>();
    data?.forEach((l) => c.set(l.action, (c.get(l.action) ?? 0) + 1));
    return Array.from(c.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="flex items-start justify-between mb-6 gap-4 flex-wrap"
      >
        <div>
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">
            Traçabilité immutable
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Journal d&apos;audit
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Trace de toutes les actions sur la plateforme.
          </p>
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

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Chip active={actionFilter === null} onClick={() => setActionFilter(null)}>
          Toutes ({data?.length ?? 0})
        </Chip>
        {actionCounts.map(([action, count]) => (
          <Chip
            key={action}
            active={actionFilter === action}
            onClick={() => setActionFilter(action)}
          >
            {action} ({count})
          </Chip>
        ))}
        <div className="ml-auto relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher acteur, ressource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-violet-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 rounded-md bg-white/[0.04]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3">
              <ScrollText size={24} className="text-zinc-500" />
            </div>
            <p className="text-zinc-100 font-semibold">Aucune action enregistrée</p>
            <p className="text-zinc-500 text-sm mt-1">
              Les actions apparaîtront ici en temps réel.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Acteur</th>
                  <th className="text-left px-4 py-3 font-semibold">Action</th>
                  <th className="text-left px-4 py-3 font-semibold">Ressource</th>
                  <th className="text-left px-4 py-3 font-semibold">Détails</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-zinc-400 tabular-nums whitespace-nowrap">
                      {log.timestamp
                        ? format(new Date(log.timestamp), "d MMM yyyy, HH:mm:ss", { locale: fr })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.actor_role && (
                          <span
                            className={`inline-flex rounded-full border text-[10px] font-semibold px-2 py-0.5 ${ROLE_COLORS[log.actor_role] ?? ""}`}
                          >
                            {log.actor_role}
                          </span>
                        )}
                        <span className="text-xs font-mono text-zinc-500 truncate max-w-[120px]">
                          {log.actor_id?.slice(0, 8) ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border text-[10px] font-semibold px-2 py-0.5 ${ACTION_COLORS[log.action] ?? "bg-zinc-500/10 text-zinc-300 border-zinc-500/30"}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-300">
                      {log.resource_type ? (
                        <>
                          <span className="font-medium">{log.resource_type}</span>
                          {log.resource_id && (
                            <span className="font-mono text-zinc-500 ml-1">
                              {log.resource_id.slice(0, 8)}...
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 max-w-[300px] truncate">
                      {log.details ? formatDetails(log.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {data && data.length >= limit && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setLimit(limit + 50)}
            className="rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors"
          >
            Charger 50 de plus
          </button>
        </div>
      )}

      <p className="text-xs text-zinc-500 mt-6 text-center">
        Politique de rétention : 365 jours (configurable via{" "}
        <code className="font-mono text-zinc-300 bg-white/[0.04] px-1 rounded">
          AMANE_AUDIT_RETENTION_DAYS
        </code>
        )
      </p>
    </div>
  );
}

function Chip({
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
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30"
          : "bg-white/[0.04] border border-white/10 text-zinc-300 hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function formatDetails(d: Record<string, unknown>): string {
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ");
}
