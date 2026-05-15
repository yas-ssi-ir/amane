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
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    ring: "ring-blue-500/25",
    glow: "from-blue-500/10",
    hoverRing: "group-hover:ring-blue-500/40",
    shadow: "group-hover:shadow-blue-500/20",
    accentLine: "via-blue-400/30",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    ring: "ring-amber-500/25",
    glow: "from-amber-500/10",
    hoverRing: "group-hover:ring-amber-500/40",
    shadow: "group-hover:shadow-amber-500/20",
    accentLine: "via-amber-400/30",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    ring: "ring-emerald-500/25",
    glow: "from-emerald-500/10",
    hoverRing: "group-hover:ring-emerald-500/40",
    shadow: "group-hover:shadow-emerald-500/20",
    accentLine: "via-emerald-400/30",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    ring: "ring-rose-500/25",
    glow: "from-rose-500/10",
    hoverRing: "group-hover:ring-rose-500/40",
    shadow: "group-hover:shadow-rose-500/20",
    accentLine: "via-rose-400/30",
  },
} as const;

export function KpiCard({
  icon,
  label,
  value,
  accent,
  subtext,
}: KpiCardProps) {
  const c = COLOR_MAP[accent];
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: easeOut },
        },
      }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`group relative rounded-2xl ring-1 ring-white/10 bg-zinc-900/40 hover:bg-white/[0.04] p-5 lg:p-6 transition-all backdrop-blur-md overflow-hidden hover:shadow-lg ${c.shadow} ${c.hoverRing}`}
    >
      {/* Top accent line */}
      <div
        aria-hidden
        className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent to-transparent ${c.accentLine}`}
      />

      {/* Hover gradient flood */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${c.glow}`}
      />

      <div className="relative">
        <div
          className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring} flex items-center justify-center mb-3 shadow-sm shadow-black/20`}
        >
          {icon}
        </div>
        <p className="text-3xl lg:text-[2rem] font-semibold tracking-tight tabular-nums text-zinc-50 leading-none">
          <AnimatedNumber value={value} duration={1.2} />
        </p>
        <p className="text-xs text-zinc-400 mt-1.5 leading-tight">{label}</p>
        {subtext && (
          <p className="text-[10px] text-zinc-500 mt-1 italic leading-tight">
            {subtext}
          </p>
        )}
      </div>
    </motion.div>
  );
}
