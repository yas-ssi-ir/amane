"use client";

import { motion } from "framer-motion";
import { TrendingUp, Sparkles } from "lucide-react";

import { AnimatedNumber } from "@/components/landing/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";

import { ConcordanceGauge } from "./ConcordanceGauge";
import { easeOut } from "./constants";

interface ConcordanceHeroProps {
  concordance: number;
  totalReviews: number;
  isLoading: boolean;
}

export function ConcordanceHero({
  concordance,
  totalReviews,
  isLoading,
}: ConcordanceHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
      className="relative mb-6 rounded-2xl ring-1 ring-white/10 bg-gradient-to-br from-violet-500/[0.06] via-zinc-900/60 to-emerald-500/[0.04] overflow-hidden backdrop-blur-md"
    >
      {/* Background glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl bg-violet-500/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl bg-emerald-500/10"
      />
      {/* Top accent line */}
      <div
        aria-hidden
        className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
      />

      <div className="relative p-7 lg:p-9 grid lg:grid-cols-[1.5fr_1fr] gap-6 items-center">
        <div>
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 ring-1 ring-violet-500/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300 mb-3">
            <Sparkles size={10} />
            Indicateur clé
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30 flex items-center justify-center">
              <TrendingUp
                size={14}
                className="text-violet-300"
                strokeWidth={2.5}
              />
            </div>
            <h2 className="font-semibold text-zinc-100 tracking-tight">
              Concordance IA / Médecin
            </h2>
          </div>

          {isLoading ? (
            <Skeleton className="h-16 bg-white/[0.04]" />
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-6xl lg:text-7xl font-semibold tracking-tight bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-500 bg-clip-text text-transparent tabular-nums leading-none">
                  <AnimatedNumber
                    value={concordance}
                    suffix="%"
                    duration={1.5}
                  />
                </span>
                <span className="text-sm text-zinc-500">
                  sur {totalReviews} décision{totalReviews > 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden ring-1 ring-white/[0.04]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${concordance}%` }}
                  transition={{ duration: 1.2, ease: easeOut }}
                  className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                />
              </div>
              <p className="text-sm text-zinc-400 mt-4 leading-relaxed max-w-xl">
                Pourcentage de cas où le médecin valide la suggestion de
                l&apos;IA. Score élevé = IA fiable. Score bas = cas complexes
                nécessitant l&apos;humain.
              </p>
            </>
          )}
        </div>
        <div className="hidden lg:flex justify-center">
          <ConcordanceGauge value={concordance} />
        </div>
      </div>
    </motion.div>
  );
}
