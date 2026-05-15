"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Gauge,
  Loader2,
  ScanSearch,
  Sparkles,
  Stethoscope,
  Video,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { absoluteUrl } from "@/lib/api";
import { useConsultation, useReviewConsultation } from "@/lib/queries";
import { reviewSchema, type ReviewInput } from "@/lib/schemas";

import { GeminiCard, detectConflict } from "@/components/GeminiCard";
import { HeatmapImage } from "@/components/HeatmapImage";
import { RiskBadge } from "@/components/RiskBadge";
import { Skeleton } from "@/components/ui/skeleton";

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

const DECISIONS = [
  {
    value: "traitement_simple" as const,
    label: "Traitement simple",
    desc: "Conseils basiques",
    fg: "text-emerald-200",
    activeBg: "bg-emerald-500/15",
    activeRing: "ring-emerald-500/50",
    activeShadow: "shadow-emerald-500/20",
    dot: "bg-emerald-400",
  },
  {
    value: "suivi" as const,
    label: "Surveillance",
    desc: "Refaire photo dans 2 sem.",
    fg: "text-blue-200",
    activeBg: "bg-blue-500/15",
    activeRing: "ring-blue-500/50",
    activeShadow: "shadow-blue-500/20",
    dot: "bg-blue-400",
  },
  {
    value: "consultation" as const,
    label: "Consultation",
    desc: "Orienter vers médecin",
    fg: "text-amber-200",
    activeBg: "bg-amber-500/15",
    activeRing: "ring-amber-500/50",
    activeShadow: "shadow-amber-500/20",
    dot: "bg-amber-400",
  },
  {
    value: "urgence" as const,
    label: "Urgence",
    desc: "Hôpital sous 24h",
    fg: "text-rose-200",
    activeBg: "bg-rose-500/15",
    activeRing: "ring-rose-500/50",
    activeShadow: "shadow-rose-500/30",
    dot: "bg-rose-400",
  },
];

// Glow color for image card based on risk level
const RISK_GLOW: Record<string, string> = {
  CRITICAL: "shadow-rose-500/30 ring-rose-500/30",
  HIGH: "shadow-amber-500/25 ring-amber-500/25",
  MEDIUM: "shadow-blue-500/20 ring-blue-500/25",
  LOW: "shadow-emerald-500/20 ring-emerald-500/25",
};

export default function MedecinWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useConsultation(id);
  const reviewMutation = useReviewConsultation(id);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      decision: "consultation",
      agrees_with_ai: true,
      modified_diagnosis: "",
      notes: "",
      prescription: "",
    },
  });

  const agreesWithAI = watch("agrees_with_ai");

  useEffect(() => {
    if (!agreesWithAI) setValue("modified_diagnosis", "");
  }, [agreesWithAI, setValue]);

  const onSubmit = async (formData: ReviewInput) => {
    try {
      await reviewMutation.mutateAsync({
        decision: formData.decision,
        agrees_with_ai: formData.agrees_with_ai,
        modified_diagnosis: formData.modified_diagnosis || undefined,
        notes: formData.notes,
        prescription: formData.prescription || undefined,
      });
      toast.success("Décision enregistrée", {
        description: "Le relais sera notifié.",
      });
      router.push("/medecin");
    } catch (e) {
      toast.error("Erreur", {
        description: e instanceof Error ? e.message : "Échec de l'enregistrement",
      });
    }
  };

  if (isLoading) return <WorkspaceSkeleton />;

  if (error || !data) {
    return (
      <div className="px-6 py-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl ring-1 ring-rose-500/30 bg-rose-500/5 p-8 text-center backdrop-blur-md"
        >
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-500/15 ring-1 ring-rose-500/30 flex items-center justify-center mb-4">
            <span
              aria-hidden
              className="absolute inset-0 rounded-2xl ring-2 ring-rose-500/40 animate-ping opacity-40"
            />
            <AlertCircle size={28} className="text-rose-300 relative" />
          </div>
          <p className="text-rose-200 font-semibold">
            {error?.message ?? "Consultation introuvable"}
          </p>
          <button
            onClick={() => router.push("/medecin")}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] ring-1 ring-white/10 hover:ring-white/20 px-4 py-2 text-sm text-zinc-200 transition-all"
          >
            <ArrowLeft size={14} />
            Retour à la file
          </button>
        </motion.div>
      </div>
    );
  }

  const ai = data.ai_result;
  const isOOD = !!ai.is_out_of_distribution;
  const isReviewed = !!data.review;
  const conflict = detectConflict(ai.risk_level, data.gemini?.assessment);

  const imageUrl = absoluteUrl(data.image_url);
  const heatmapUrl = absoluteUrl(ai.heatmap_url);
  const riskGlow =
    !isOOD && ai.risk_level ? RISK_GLOW[ai.risk_level] : "ring-white/10";
  const isCritical = ai.risk_level === "CRITICAL" && !isOOD;

  return (
    <div className="max-w-7xl">
      {/* ============= Sticky top bar ============= */}
      <div className="sticky top-0 z-20 px-6 lg:px-10 py-4 border-b border-white/[0.06] bg-zinc-950/85 backdrop-blur-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <motion.button
            onClick={() => router.push("/medecin")}
            whileHover={{ x: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.04] ring-1 ring-transparent hover:ring-white/10 transition-all"
          >
            <ArrowLeft size={14} />
            File
          </motion.button>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-zinc-200 rounded-md bg-white/[0.04] ring-1 ring-white/10 px-2 py-0.5">
              {data.anonymous_patient_id}
            </span>
            <RiskBadge
              level={ai.risk_level}
              isUncertain={ai.is_uncertain && !isOOD}
              isOOD={isOOD}
              size="sm"
              glow
            />
            {!isOOD && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500 tabular-nums">
                <Gauge size={11} strokeWidth={2.2} />
                {Math.round(ai.confidence * 100)}%
              </span>
            )}
          </div>
          <div className="ml-auto text-xs text-zinc-500 tabular-nums">
            {data.created_at &&
              format(new Date(data.created_at), "PPp", { locale: fr })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="grid lg:grid-cols-[1.3fr_1fr] gap-6 px-6 lg:px-10 py-8"
        >
          {/* ===================== LEFT — Image + AI ===================== */}
          <div className="space-y-6">
            {/* Image card with risk-coded glow */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 flex items-center gap-1.5">
                  <Sparkles
                    size={12}
                    className="text-emerald-400"
                    strokeWidth={2.5}
                  />
                  Image analysée
                </h2>
                {isCritical && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-300 font-semibold uppercase tracking-widest">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                    </span>
                    Priorité maximale
                  </span>
                )}
              </div>
              <div
                className={`relative rounded-2xl ring-1 shadow-2xl transition-shadow ${riskGlow}`}
              >
                <HeatmapImage imageUrl={imageUrl} heatmapUrl={heatmapUrl} />
              </div>
            </div>

            {/* Patient video */}
            {data.video_url && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeOut }}
                className="rounded-2xl ring-1 ring-blue-500/25 bg-blue-500/[0.04] overflow-hidden backdrop-blur-sm"
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <Video size={14} className="text-blue-300" strokeWidth={2.4} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200">
                    Vidéo du patient
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-auto">
                    Description orale · max 60 s
                  </span>
                </div>
                <div className="p-4">
                  <video
                    src={absoluteUrl(data.video_url)}
                    controls
                    playsInline
                    className="w-full rounded-xl bg-zinc-900"
                    style={{ maxHeight: 280 }}
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>
              </motion.div>
            )}

            {/* OOD warning — premium */}
            {isOOD && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl ring-1 ring-violet-500/30 bg-violet-500/[0.06] p-5 overflow-hidden backdrop-blur-sm"
              >
                <div
                  aria-hidden
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl bg-violet-500/20 pointer-events-none"
                />
                <div className="relative flex items-start gap-3">
                  <div className="relative w-10 h-10 rounded-xl bg-violet-500/15 ring-1 ring-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-xl ring-2 ring-violet-500/40 animate-ping opacity-30"
                    />
                    <ScanSearch
                      size={18}
                      className="text-violet-300 relative"
                      strokeWidth={2.4}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-violet-200">
                      Image hors-distribution détectée
                    </p>
                    <p className="text-sm text-violet-300/80 mt-1.5 leading-relaxed">
                      L&apos;IA n&apos;a pas reconnu cette image dans son
                      domaine d&apos;entraînement (HAM10000, 7 classes
                      dermatologiques). Examinez l&apos;image manuellement.
                    </p>
                    {ai.entropy_normalized != null && (
                      <p className="text-xs text-violet-400/60 mt-2 font-mono inline-block rounded bg-violet-500/10 ring-1 ring-violet-500/20 px-1.5 py-0.5">
                        entropy {ai.entropy_normalized.toFixed(3)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ResNet18 — control center card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: easeOut }}
              className="relative rounded-2xl ring-1 ring-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-zinc-900/40 to-teal-500/[0.03] overflow-hidden backdrop-blur-md"
            >
              <div
                aria-hidden
                className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
              />
              <div
                aria-hidden
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl bg-emerald-500/10 pointer-events-none"
              />

              {/* Card header */}
              <div className="relative px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/15 ring-1 ring-emerald-500/25 flex items-center justify-center">
                  <Cpu size={12} className="text-emerald-300" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200 flex-1">
                  Analyse IA · ResNet18 calibré
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {ai.model_version}
                </span>
              </div>

              <div className="relative p-5">
                {/* Diagnosis */}
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
                  Diagnostic primaire
                </p>
                <p
                  className={`text-3xl font-semibold tracking-tight leading-tight ${
                    isOOD ? "text-zinc-500" : "text-zinc-50"
                  }`}
                >
                  {isOOD ? "—" : ai.primary_diagnosis}
                </p>

                {/* Confidence — large gradient bar */}
                {!isOOD && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold uppercase tracking-[0.16em] text-zinc-500 flex items-center gap-1.5">
                        <Activity size={11} strokeWidth={2.5} />
                        Confiance calibrée
                      </span>
                      <span className="text-base font-semibold text-zinc-100 tabular-nums">
                        {Math.round(ai.confidence * 100)}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden ring-1 ring-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.round(ai.confidence * 100)}%`,
                        }}
                        transition={{ duration: 1.1, ease: easeOut }}
                        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                      />
                    </div>
                  </div>
                )}

                {/* Top 3 alternatives */}
                {!isOOD && ai.alternatives.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-white/[0.06]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3">
                      Top {ai.alternatives.length} alternatives
                    </p>
                    <div className="space-y-3">
                      {ai.alternatives.map((alt, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-zinc-300">{alt.label}</span>
                            <span className="text-zinc-500 text-xs font-semibold tabular-nums">
                              {Math.round(alt.score * 100)}%
                            </span>
                          </div>
                          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.max(2, Math.round(alt.score * 100))}%`,
                              }}
                              transition={{
                                duration: 0.9,
                                delay: 0.3 + i * 0.1,
                                ease: easeOut,
                              }}
                              className="h-full bg-gradient-to-r from-zinc-400 to-zinc-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Telemetry */}
                <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                  <Telemetry
                    label="Modèle"
                    value={ai.model_version}
                    icon={<Cpu size={11} strokeWidth={2.5} />}
                  />
                  <Telemetry
                    label="Latence"
                    value={`${(ai.latency_seconds * 1000).toFixed(0)} ms`}
                    icon={<Zap size={11} strokeWidth={2.5} />}
                  />
                </div>
              </div>
            </motion.div>

            {/* Gemini card */}
            <GeminiCard gemini={data.gemini} conflictWithResnet={conflict} />
          </div>

          {/* ===================== RIGHT — Patient + Form ===================== */}
          <div className="space-y-6">
            {/* Patient info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
              className="relative rounded-2xl ring-1 ring-white/10 bg-zinc-900/40 p-5 backdrop-blur-md overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2">
                Dossier patient
              </p>
              <p className="font-mono text-base text-zinc-100 inline-block rounded-md bg-white/[0.04] ring-1 ring-white/10 px-2 py-0.5">
                {data.anonymous_patient_id}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                {data.body_area && <Row label="Zone" value={data.body_area} />}
                {data.symptoms_duration && (
                  <Row label="Durée" value={data.symptoms_duration} />
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2">
                  Symptômes décrits
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {data.symptoms}
                </p>
              </div>
            </motion.div>

            {/* Already reviewed ? */}
            {isReviewed && data.review ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                className="relative rounded-2xl ring-1 ring-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.07] to-emerald-500/[0.03] p-5 overflow-hidden backdrop-blur-md"
              >
                <div
                  aria-hidden
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl bg-emerald-500/15 pointer-events-none"
                />
                <div className="relative flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2
                      size={14}
                      className="text-emerald-300"
                      strokeWidth={2.5}
                    />
                  </div>
                  <p className="font-semibold text-emerald-200">
                    Cas déjà validé
                  </p>
                </div>
                <p className="text-sm text-emerald-200/90 mb-3 relative">
                  Décision :{" "}
                  <strong>{decisionLabel(data.review.decision)}</strong>
                </p>
                {data.review.notes && (
                  <p className="text-sm text-emerald-200/80 italic leading-relaxed relative">
                    &ldquo;{data.review.notes}&rdquo;
                  </p>
                )}
                <p className="text-xs text-emerald-300/60 mt-3 relative">
                  Par Dr. {data.review.medecin_name}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                className="relative rounded-2xl ring-1 ring-white/10 bg-zinc-900/40 p-5 space-y-5 backdrop-blur-md overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
                />

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center">
                    <Stethoscope
                      size={14}
                      className="text-emerald-300"
                      strokeWidth={2.5}
                    />
                  </div>
                  <h3 className="font-semibold text-zinc-100">Votre décision</h3>
                </div>

                {/* Decision buttons — premium */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2.5">
                    Action recommandée
                  </p>
                  <Controller
                    control={control}
                    name="decision"
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2.5">
                        {DECISIONS.map((d) => {
                          const active = field.value === d.value;
                          return (
                            <motion.button
                              key={d.value}
                              type="button"
                              onClick={() => field.onChange(d.value)}
                              whileTap={{ scale: 0.97 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                              }}
                              className={[
                                "relative rounded-xl ring-1 p-3 text-left transition-all overflow-hidden",
                                active
                                  ? `${d.activeBg} ring-2 ${d.activeRing} shadow-lg ${d.activeShadow}`
                                  : "bg-white/[0.02] ring-white/10 hover:ring-white/20 hover:bg-white/[0.04]",
                              ].join(" ")}
                            >
                              {active && (
                                <span
                                  aria-hidden
                                  className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${d.dot}`}
                                />
                              )}
                              <p
                                className={`font-semibold text-sm leading-tight ${
                                  active ? d.fg : "text-zinc-100"
                                }`}
                              >
                                {d.label}
                              </p>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                {d.desc}
                              </p>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                {/* Agrees with AI */}
                <Controller
                  control={control}
                  name="agrees_with_ai"
                  render={({ field }) => (
                    <label className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl ring-1 ring-white/10 cursor-pointer hover:ring-white/20 hover:bg-white/[0.03] transition-all">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-emerald-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-200">
                          Je suis d&apos;accord avec la suggestion IA
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Décocher si vous corrigez le diagnostic
                        </p>
                      </div>
                    </label>
                  )}
                />

                {!agreesWithAI && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Diagnostic corrigé
                    </label>
                    <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all">
                      <input
                        {...register("modified_diagnosis")}
                        placeholder="Diagnostic clinique correct"
                        className="w-full bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 px-3 py-2.5 text-sm rounded-lg"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Notes au relais{" "}
                    <span className="text-rose-400 normal-case">*</span>
                  </label>
                  <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all">
                    <textarea
                      {...register("notes")}
                      rows={3}
                      placeholder="Instructions claires pour le terrain..."
                      className="w-full bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 px-3 py-2.5 text-sm rounded-lg resize-none"
                    />
                  </div>
                  {errors.notes && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-0.5">
                      <span className="inline-block w-1 h-1 rounded-full bg-rose-400" />
                      {errors.notes.message}
                    </p>
                  )}
                </div>

                {/* Prescription */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Prescription{" "}
                    <span className="text-zinc-600 normal-case">(optionnel)</span>
                  </label>
                  <div className="rounded-lg bg-white/[0.04] ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all">
                    <textarea
                      {...register("prescription")}
                      rows={2}
                      placeholder="Crèmes, médicaments, examens..."
                      className="w-full bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 px-3 py-2.5 text-sm rounded-lg resize-none"
                    />
                  </div>
                </div>

                {/* Submit — premium gradient + sheen */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 hover:shadow-emerald-500/50 text-zinc-950 font-semibold py-3 inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-60 transition-shadow duration-300"
                >
                  <span className="relative flex items-center gap-2 text-sm">
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <ClipboardCheck size={16} strokeWidth={2.5} />
                        Valider la décision
                      </>
                    )}
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-y-0 -left-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[400%] transition-transform duration-1000 ease-out skew-x-12"
                  />
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </form>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-zinc-500 text-xs">{label}</span>
      <span className="text-zinc-200 font-medium">{value}</span>
    </div>
  );
}

function Telemetry({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/[0.02] ring-1 ring-white/[0.06] p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-mono text-xs text-zinc-300 mt-1 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function decisionLabel(d: string): string {
  switch (d) {
    case "traitement_simple":
      return "Traitement simple";
    case "suivi":
      return "Surveillance et suivi";
    case "consultation":
      return "Consultation médicale";
    case "urgence":
      return "URGENCE";
    default:
      return d;
  }
}

function WorkspaceSkeleton() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-7xl">
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-2xl bg-white/[0.04]" />
          <Skeleton className="h-12 rounded-xl bg-white/[0.04]" />
          <Skeleton className="h-64 rounded-2xl bg-white/[0.04]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl bg-white/[0.04]" />
          <Skeleton className="h-[28rem] rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
