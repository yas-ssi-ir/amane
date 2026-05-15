import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ScanSearch,
  Stethoscope,
} from "lucide-react";

import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  level?: RiskLevel | null;
  isUncertain?: boolean;
  isOOD?: boolean;
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

const CONFIG: Record<
  RiskLevel,
  {
    label: string;
    classes: string;
    glowColor: string;
    Icon: typeof CheckCircle2;
    pulse?: boolean;
  }
> = {
  LOW: {
    label: "Faible",
    classes: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    glowColor: "shadow-emerald-500/40",
    Icon: CheckCircle2,
  },
  MEDIUM: {
    label: "Modéré",
    classes: "bg-blue-500/10 text-blue-300 ring-blue-500/30",
    glowColor: "shadow-blue-500/30",
    Icon: Info,
  },
  HIGH: {
    label: "Élevé",
    classes: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
    glowColor: "shadow-amber-500/40",
    Icon: AlertTriangle,
  },
  CRITICAL: {
    label: "Critique",
    classes: "bg-rose-500/15 text-rose-200 ring-rose-500/40",
    glowColor: "shadow-rose-500/50",
    Icon: AlertCircle,
    pulse: true,
  },
};

export function RiskBadge({
  level,
  isUncertain,
  isOOD,
  size = "md",
  glow = false,
}: Props) {
  const sz =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : size === "lg"
        ? "text-sm px-3 py-1.5"
        : "text-xs px-2.5 py-1";
  const ic = size === "sm" ? 11 : size === "lg" ? 14 : 13;

  if (isOOD) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full ring-1 bg-violet-500/10 text-violet-300 ring-violet-500/30 font-semibold",
          sz,
        )}
      >
        <ScanSearch size={ic} strokeWidth={2.5} />
        Atypique
      </span>
    );
  }
  if (isUncertain) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full ring-1 bg-violet-500/10 text-violet-300 ring-violet-500/30 font-semibold",
          sz,
        )}
      >
        <Stethoscope size={ic} strokeWidth={2.5} />
        À examiner
      </span>
    );
  }
  if (!level) return null;
  const c = CONFIG[level];

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full ring-1 font-semibold transition-shadow",
        c.classes,
        sz,
        glow && `shadow-lg ${c.glowColor}`,
      )}
    >
      {/* Pulsating halo for CRITICAL */}
      {c.pulse && glow && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full ring-2 ring-rose-500/40 animate-ping opacity-60"
        />
      )}
      <c.Icon
        size={ic}
        strokeWidth={2.5}
        className={cn("relative", c.pulse && glow && "drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]")}
      />
      <span className="relative">{c.label}</span>
    </span>
  );
}
