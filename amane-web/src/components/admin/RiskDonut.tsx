"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import type { ConsultationListItem, RiskLevel } from "@/lib/types";

import { easeOut, RISK_COLORS, RISK_LABELS_MAP } from "./constants";

interface RiskDonutProps {
  consultations: ConsultationListItem[] | undefined;
  isLoading: boolean;
}

export function RiskDonut({ consultations, isLoading }: RiskDonutProps) {
  const { riskData, total } = useMemo(() => {
    const counts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    consultations?.forEach((c) => {
      if (c.ai_risk_level) counts[c.ai_risk_level]++;
    });
    const data = (Object.keys(counts) as RiskLevel[])
      .map((k) => ({ name: RISK_LABELS_MAP[k] ?? k, value: counts[k], color: RISK_COLORS[k] }))
      .filter((d) => d.value > 0);
    return { riskData: data, total: data.reduce((s, d) => s + d.value, 0) };
  }, [consultations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-violet-300" />
        <h2 className="font-semibold text-zinc-100">Répartition par niveau de risque</h2>
      </div>
      {isLoading ? (
        <Skeleton className="h-64 bg-white/[0.04]" />
      ) : riskData.length === 0 ? (
        <EmptyState label="Aucune consultation analysée" />
      ) : (
        <div className="h-64 flex items-center">
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{
                    background: "rgba(24, 24, 27, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fafafa",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-semibold tabular-nums text-zinc-100">{total}</span>
              <span className="text-xs text-zinc-500">cas analysés</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {riskData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-zinc-300 flex-1">{d.name}</span>
                <span className="font-semibold text-zinc-100 tabular-nums">{d.value}</span>
                <span className="text-xs text-zinc-500 w-10 text-right tabular-nums">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
        <Activity size={20} className="text-zinc-600" />
      </div>
      <p className="text-zinc-500 text-sm">{label}</p>
    </div>
  );
}
