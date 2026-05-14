"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import type { ConsultationListItem } from "@/lib/types";

import { easeOut } from "./constants";

interface TopDiagnosesProps {
  consultations: ConsultationListItem[] | undefined;
  isLoading: boolean;
}

export function TopDiagnoses({ consultations, isLoading }: TopDiagnosesProps) {
  const topDiagnoses = useMemo(() => {
    const counts = new Map<string, number>();
    consultations?.forEach((c) => {
      if (c.ai_prediction) {
        counts.set(c.ai_prediction, (counts.get(c.ai_prediction) ?? 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name: shorten(name), full: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [consultations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: easeOut }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-violet-300" />
        <h2 className="font-semibold text-zinc-100">Top 5 diagnostics IA</h2>
      </div>
      {isLoading ? (
        <Skeleton className="h-64 bg-white/[0.04]" />
      ) : topDiagnoses.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <Activity size={20} className="text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm">Aucun diagnostic disponible</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topDiagnoses}
              layout="vertical"
              margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                width={120}
              />
              <RTooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "rgba(24, 24, 27, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fafafa",
                }}
                formatter={(value, _name, props) => [
                  `${Number(value)} cas`,
                  (props as { payload: { full: string } }).payload.full,
                ]}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

function shorten(s: string): string {
  return s.length > 22 ? s.slice(0, 22) + "…" : s;
}
