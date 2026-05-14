"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

import { AnimatedNumber } from "@/components/landing/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";

import { ConcordanceGauge } from "./ConcordanceGauge";
import { easeOut } from "./constants";

interface ConcordanceHeroProps {
  concordance: number;
  totalReviews: number;
  isLoading: boolean;
}

export function ConcordanceHero({ concordance, totalReviews, isLoading }: ConcordanceHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
      className="relative mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.05] via-zinc-900/60 to-emerald-500/[0.04] overflow-hidden"
    >
      <div className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 bg-violet-500/15 rounded-full blur-3xl" />
      <div className="relative p-7 lg:p-9 grid lg:grid-cols-[1.5fr_1fr] gap-6 items-center">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-violet-300" />
            <h2 className="font-semibold text-zinc-100">Concordance IA / Médecin</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-16 bg-white/[0.04]" />
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-6xl font-semibold tracking-tight bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent tabular-nums">
                  <AnimatedNumber value={concordance} suffix="%" duration={1.5} />
                </span>
                <span className="text-sm text-zinc-500">
                  sur {totalReviews} décision{totalReviews > 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${concordance}%` }}
                  transition={{ duration: 1.2, ease: easeOut }}
                  className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500"
                />
              </div>
              <p className="text-sm text-zinc-400 mt-4 leading-relaxed max-w-xl">
                Pourcentage de cas où le médecin valide la suggestion de l&apos;IA. Score
                élevé = IA fiable. Score bas = cas complexes nécessitant l&apos;humain.
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
