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
  size?: "sm" | "md";
}

const CONFIG: Record<RiskLevel, { label: string; classes: string; Icon: typeof CheckCircle2 }> = {
  LOW: {
    label: "Faible",
    classes: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    Icon: CheckCircle2,
  },
  MEDIUM: {
    label: "Modéré",
    classes: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    Icon: Info,
  },
  HIGH: {
    label: "Élevé",
    classes: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    Icon: AlertTriangle,
  },
  CRITICAL: {
    label: "Critique",
    classes: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    Icon: AlertCircle,
  },
};

export function RiskBadge({ level, isUncertain, isOOD, size = "md" }: Props) {
  const sz = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  const ic = size === "sm" ? 11 : 13;

  if (isOOD) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border bg-violet-500/10 text-violet-300 border-violet-500/30 font-semibold", sz)}>
        <ScanSearch size={ic} strokeWidth={2.5} />
        Atypique
      </span>
    );
  }
  if (isUncertain) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border bg-violet-500/10 text-violet-300 border-violet-500/30 font-semibold", sz)}>
        <Stethoscope size={ic} strokeWidth={2.5} />
        À examiner
      </span>
    );
  }
  if (!level) return null;
  const c = CONFIG[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border font-semibold", c.classes, sz)}>
      <c.Icon size={ic} strokeWidth={2.5} />
      {c.label}
    </span>
  );
}
