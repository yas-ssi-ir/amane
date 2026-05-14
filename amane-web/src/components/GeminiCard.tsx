"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ScanSearch,
  Sparkles,
  XCircle,
} from "lucide-react";

import type { GeminiAssessment, GeminiResult } from "@/lib/types";

interface Props {
  gemini: GeminiResult | null;
  conflictWithResnet?: boolean;
}

const ASSESSMENT: Record<
  GeminiAssessment,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    Icon: typeof CheckCircle2;
  }
> = {
  benign: {
    label: "Bénin probable",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
    Icon: CheckCircle2,
  },
  suspicious: {
    label: "Suspect",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/30",
    Icon: AlertTriangle,
  },
  atypical: {
    label: "Atypique",
    bg: "bg-violet-500/10",
    text: "text-violet-300",
    border: "border-violet-500/30",
    Icon: ScanSearch,
  },
  unclear: {
    label: "Image non lisible",
    bg: "bg-zinc-500/10",
    text: "text-zinc-300",
    border: "border-zinc-500/30",
    Icon: HelpCircle,
  },
  non_lesion: {
    label: "Pas une lésion",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    border: "border-rose-500/30",
    Icon: XCircle,
  },
};

export function GeminiCard({ gemini, conflictWithResnet }: Props) {
  if (!gemini) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
        <Sparkles size={18} className="mx-auto mb-2 text-zinc-600" />
        <p className="text-sm text-zinc-400">Second avis IA non disponible</p>
        <p className="text-xs text-zinc-600 mt-1">Gemini désactivé pour cette consultation.</p>
      </div>
    );
  }

  const cfg = ASSESSMENT[gemini.assessment];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.03] via-white/[0.02] to-fuchsia-500/[0.02] overflow-hidden"
    >
      {/* Glow background */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
        <Sparkles size={14} className="text-violet-300" />
        <span className="text-xs font-bold uppercase tracking-wider text-violet-200 flex-1">
          Second avis Gemini
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">{gemini.model}</span>
      </div>

      <div className="relative p-5">
        {/* Assessment badge */}
        <div className={`inline-flex items-center gap-2 ${cfg.bg} ${cfg.text} px-3 py-1.5 rounded-full font-semibold text-sm border ${cfg.border} mb-4`}>
          <cfg.Icon size={14} strokeWidth={2.5} />
          {cfg.label}
        </div>

        {/* Conflict warning */}
        {conflictWithResnet && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 mb-4 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 leading-relaxed">
              <strong>Divergence avec ResNet18.</strong> Les deux IA n&apos;ont pas le même
              avis — examen attentif recommandé.
            </p>
          </div>
        )}

        {/* Description */}
        {gemini.description && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
              Observation
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed italic">
              &ldquo;{gemini.description}&rdquo;
            </p>
          </div>
        )}

        {/* Concerns */}
        {gemini.concerns && gemini.concerns.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
              Signes ABCDE détectés
            </p>
            <ul className="space-y-1">
              {gemini.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended action */}
        {gemini.recommended_action && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
              Action recommandée
            </p>
            <p className="text-sm text-zinc-200 font-medium">
              {gemini.recommended_action}
            </p>
          </div>
        )}

        <p className="text-[10px] text-zinc-600 mt-4 italic leading-relaxed">
          Modèle multimodal généraliste · sortie informative · ne remplace pas votre jugement clinique.
        </p>
      </div>
    </motion.div>
  );
}

export function detectConflict(
  riskLevel: string | null | undefined,
  assessment: GeminiAssessment | null | undefined,
): boolean {
  if (!riskLevel || !assessment) return false;
  if (riskLevel === "LOW" && (assessment === "suspicious" || assessment === "atypical")) {
    return true;
  }
  if ((riskLevel === "HIGH" || riskLevel === "CRITICAL") && assessment === "benign") {
    return true;
  }
  if (assessment === "non_lesion") {
    return true;
  }
  return false;
}
