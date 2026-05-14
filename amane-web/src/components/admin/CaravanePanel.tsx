"use client";

import { motion } from "framer-motion";
import { AlertTriangle, MapPin, Stethoscope, TrendingUp } from "lucide-react";

import { easeOut } from "./constants";

interface RegionStat {
  count: number;
  urgent: number;
  priorityScores?: number[];
}

interface Props {
  regionStats: Map<string, RegionStat>;
  isLoading?: boolean;
}

const PRIORITY_THRESHOLDS = {
  high: { minCount: 3, minUrgent: 1 },
  medium: { minCount: 2, minUrgent: 0 },
};

function getPriority(count: number, urgent: number): "high" | "medium" | "low" {
  const urgencyRate = count > 0 ? urgent / count : 0;
  if (urgent >= PRIORITY_THRESHOLDS.high.minUrgent && count >= PRIORITY_THRESHOLDS.high.minCount && urgencyRate >= 0.3) return "high";
  if (count >= PRIORITY_THRESHOLDS.medium.minCount) return "medium";
  return "low";
}

const PRIORITY_CONFIG = {
  high: {
    label: "Priorité haute",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    bar: "bg-rose-400",
    message: "Taux d'urgences élevé — caravane recommandée",
  },
  medium: {
    label: "Priorité moyenne",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    message: "Activité notable — à surveiller",
  },
  low: {
    label: "Priorité basse",
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-700",
    dot: "bg-zinc-500",
    bar: "bg-zinc-600",
    message: "Couverture suffisante",
  },
};

export function CaravanePanel({ regionStats, isLoading }: Props) {
  const sorted = Array.from(regionStats.entries())
    .map(([region, stat]) => {
      const scores = stat.priorityScores ?? [];
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      return {
        region,
        count: stat.count,
        urgent: stat.urgent,
        priority: getPriority(stat.count, stat.urgent),
        urgencyRate: stat.count > 0 ? Math.round((stat.urgent / stat.count) * 100) : 0,
        avgPriorityScore: avgScore != null ? Math.round(avgScore * 100) : null,
      };
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return b.urgent - a.urgent || b.count - a.count;
    });

  const maxCount = Math.max(...sorted.map((r) => r.count), 1);
  const highPriority = sorted.filter((r) => r.priority === "high");

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 animate-pulse">
        <div className="h-4 w-48 bg-white/10 rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-white/[0.04] rounded-xl mb-3" />
        ))}
      </div>
    );
  }

  if (regionStats.size === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
        <MapPin size={20} className="mx-auto mb-2 text-zinc-600" />
        <p className="text-sm text-zinc-500">Aucune donnée régionale disponible</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Stethoscope size={16} className="text-emerald-300" />
          <h2 className="font-semibold text-zinc-100">Recommandations caravanes médicales</h2>
        </div>
        {highPriority.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full px-3 py-1">
            <AlertTriangle size={11} />
            {highPriority.length} région{highPriority.length > 1 ? "s" : ""} prioritaire{highPriority.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Summary banner for high priority */}
      {highPriority.length > 0 && (
        <div className="mx-4 mt-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-200 leading-relaxed">
            <strong>{highPriority.map((r) => r.region).join(", ")}</strong> présentent un taux d&apos;urgences élevé.
            Envoi d&apos;une caravane médicale fortement recommandé.
          </p>
        </div>
      )}

      {/* Region list */}
      <div className="p-4 space-y-3">
        {sorted.map((item, i) => {
          const cfg = PRIORITY_CONFIG[item.priority];
          return (
            <motion.div
              key={item.region}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: easeOut }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <span className="text-sm font-medium text-zinc-100">{item.region}</span>
                </div>
                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Bar */}
              <div className="h-1.5 bg-white/[0.06] rounded-full mb-2 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${cfg.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04 + 0.1, ease: easeOut }}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-zinc-500">{cfg.message}</p>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <TrendingUp size={10} />
                    {item.count} consultation{item.count > 1 ? "s" : ""}
                  </span>
                  {item.avgPriorityScore != null && (
                    <span className="text-violet-400 font-semibold text-[11px]">
                      Score {item.avgPriorityScore}%
                    </span>
                  )}
                  {item.urgent > 0 && (
                    <span className="flex items-center gap-1 text-rose-400 font-semibold">
                      <AlertTriangle size={10} />
                      {item.urgent} urgent{item.urgent > 1 ? "es" : "e"} ({item.urgencyRate}%)
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
