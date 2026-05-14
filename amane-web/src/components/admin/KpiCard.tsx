"use client";

import { motion } from "framer-motion";

import { AnimatedNumber } from "@/components/landing/AnimatedNumber";

import { easeOut } from "./constants";

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "blue" | "amber" | "emerald" | "rose";
  subtext?: string;
}

const COLOR_MAP = {
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-300",    ring: "ring-blue-500/20" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-300",   ring: "ring-amber-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-300", ring: "ring-emerald-500/20" },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-300",    ring: "ring-rose-500/20" },
} as const;

export function KpiCard({ icon, label, value, accent, subtext }: KpiCardProps) {
  const c = COLOR_MAP[accent];
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
      }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 p-6 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums text-zinc-100">
        <AnimatedNumber value={value} duration={1.2} />
      </p>
      <p className="text-xs text-zinc-400 mt-1">{label}</p>
      {subtext && <p className="text-[10px] text-zinc-500 mt-1 italic">{subtext}</p>}
    </motion.div>
  );
}
