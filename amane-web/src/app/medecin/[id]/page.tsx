"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  ScanSearch,
  Sparkles,
  Stethoscope,
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
    fg: "text-emerald-300",
    bgActive: "bg-emerald-500/15 ring-emerald-500/40",
    border: "border-emerald-500/20",
  },
  {
    value: "suivi" as const,
    label: "Surveillance",
    desc: "Refaire photo dans 2 sem.",
    fg: "text-blue-300",
    bgActive: "bg-blue-500/15 ring-blue-500/40",
    border: "border-blue-500/20",
  },
  {
    value: "consultation" as const,
    label: "Consultation",
    desc: "Orienter vers médecin",
    fg: "text-amber-300",
    bgActive: "bg-amber-500/15 ring-amber-500/40",
    border: "border-amber-500/20",
  },
  {
    value: "urgence" as const,
    label: "Urgence",
    desc: "Hôpital sous 24h",
    fg: "text-rose-300",
    bgActive: "bg-rose-500/15 ring-rose-500/40",
    border: "border-rose-500/20",
  },
];

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
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
          <AlertCircle size={40} className="mx-auto text-rose-400 mb-3" />
          <p className="text-rose-200 font-semibold">
            {error?.message ?? "Consultation introuvable"}
          </p>
          <button
            onClick={() => router.push("/medecin")}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2 text-sm text-zinc-200 transition-colors"
          >
            <ArrowLeft size={14} />
            Retour à la file
          </button>
        </div>
      </div>
    );
  }

  const ai = data.ai_result;
  const isOOD = !!ai.is_out_of_distribution;
  const isReviewed = !!data.review;
  const conflict = detectConflict(ai.risk_level, data.gemini?.assessment);

  const imageUrl = absoluteUrl(data.image_url);
  const heatmapUrl = absoluteUrl(ai.heatmap_url);

  return (
    <div className="max-w-7xl">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 py-4 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => router.push("/medecin")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft size={14} />
            File
          </button>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-zinc-200">
              {data.anonymous_patient_id}
            </span>
            <RiskBadge
              level={ai.risk_level}
              isUncertain={ai.is_uncertain && !isOOD}
              isOOD={isOOD}
              size="sm"
            />
            {!isOOD && (
              <span className="text-xs text-zinc-500 tabular-nums">
                Confiance {Math.round(ai.confidence * 100)}%
              </span>
            )}
          </div>
          <div className="ml-auto text-xs text-zinc-500">
            {data.created_at && format(new Date(data.created_at), "PPp", { locale: fr })}
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
          {/* LEFT — Image + IA cards */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400" />
                Image analysée
              </h2>
              <HeatmapImage imageUrl={imageUrl} heatmapUrl={heatmapUrl} />
            </div>

            {/* Vidéo patient */}
            {data.video_url && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeOut }}
                className="rounded-2xl border border-blue-500/25 bg-blue-500/[0.04] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    Vidéo du patient
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-auto">Description orale · max 60 s</span>
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

            {/* OOD warning */}
            {isOOD && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.06] p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 ring-1 ring-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <ScanSearch size={18} className="text-violet-300" strokeWidth={2.4} />
                  </div>
                  <div>
                    <p className="font-semibold text-violet-200">
                      Image hors-distribution détectée
                    </p>
                    <p className="text-sm text-violet-300/80 mt-1.5 leading-relaxed">
                      L&apos;IA n&apos;a pas reconnu cette image dans son domaine
                      d&apos;entraînement (HAM10000, 7 classes dermatologiques).
                      Examinez l&apos;image manuellement.
                    </p>
                    {ai.entropy_normalized != null && (
                      <p className="text-xs text-violet-400/60 mt-2 font-mono">
                        Entropie : {ai.entropy_normalized.toFixed(3)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ResNet18 card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: easeOut }}
              className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.03] via-white/[0.02] to-teal-500/[0.02] overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex-1">
                  Analyse IA — ResNet18 calibré
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">{ai.model_version}</span>
              </div>

              <div className="p-5">
                <p className={`text-2xl font-semibold ${isOOD ? 'text-zinc-500' : 'text-zinc-100'}`}>
                  {isOOD ? "—" : ai.primary_diagnosis}
                </p>

                {!isOOD && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold uppercase tracking-widest text-zinc-500">
                        Confiance
                      </span>
                      <span className="font-bold text-zinc-200 tabular-nums">
                        {Math.round(ai.confidence * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(ai.confidence * 100)}%` }}
                        transition={{ duration: 1, ease: easeOut }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      />
                    </div>
                  </div>
                )}

                {/* Top 3 alternatives */}
                {!isOOD && ai.alternatives.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-white/[0.06]">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                      Top 3 alternatives
                    </p>
                    <div className="space-y-2.5">
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
                              animate={{ width: `${Math.max(2, Math.round(alt.score * 100))}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: easeOut }}
                              className="h-full bg-zinc-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-500 uppercase tracking-widest">Modèle</p>
                    <p className="font-mono text-zinc-300 mt-0.5">{ai.model_version}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 uppercase tracking-widest">Latence</p>
                    <p className="font-mono text-zinc-300 mt-0.5">
                      {(ai.latency_seconds * 1000).toFixed(0)} ms
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Gemini card */}
            <GeminiCard gemini={data.gemini} conflictWithResnet={conflict} />
          </div>

          {/* RIGHT — Patient + Form */}
          <div className="space-y-6">
            {/* Patient info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                Dossier patient
              </p>
              <p className="font-mono text-sm text-zinc-200">
                {data.anonymous_patient_id}
              </p>
              <div className="mt-3 space-y-1.5 text-sm">
                {data.body_area && <Row label="Zone" value={data.body_area} />}
                {data.symptoms_duration && <Row label="Durée" value={data.symptoms_duration} />}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Symptômes décrits
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">{data.symptoms}</p>
              </div>
            </motion.div>

            {/* Already reviewed ? */}
            {isReviewed && data.review ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <p className="font-semibold text-emerald-200">Cas déjà validé</p>
                </div>
                <p className="text-sm text-emerald-200/90 mb-3">
                  Décision : <strong>{decisionLabel(data.review.decision)}</strong>
                </p>
                {data.review.notes && (
                  <p className="text-sm text-emerald-200/80 italic">
                    &ldquo;{data.review.notes}&rdquo;
                  </p>
                )}
                <p className="text-xs text-emerald-300/60 mt-3">
                  Par Dr. {data.review.medecin_name}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope size={18} className="text-emerald-400" />
                  <h3 className="font-semibold text-zinc-100">Votre décision</h3>
                </div>

                {/* Decision buttons */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                    Action recommandée
                  </p>
                  <Controller
                    control={control}
                    name="decision"
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        {DECISIONS.map((d) => {
                          const active = field.value === d.value;
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => field.onChange(d.value)}
                              className={[
                                "rounded-xl border p-3 text-left transition-all",
                                active
                                  ? `${d.bgActive} ring-2 ${d.border}`
                                  : "bg-white/[0.02] border-white/10 hover:border-white/20",
                              ].join(" ")}
                            >
                              <p className={`font-semibold text-sm ${active ? d.fg : "text-zinc-100"}`}>
                                {d.label}
                              </p>
                              <p className="text-[11px] text-zinc-500 mt-0.5">{d.desc}</p>
                            </button>
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
                    <label className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
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
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Diagnostic corrigé
                    </label>
                    <input
                      {...register("modified_diagnosis")}
                      placeholder="Diagnostic clinique correct"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Notes au relais *
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    placeholder="Instructions claires pour le terrain..."
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  {errors.notes && (
                    <p className="text-xs text-rose-400">{errors.notes.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Prescription (optionnel)
                  </label>
                  <textarea
                    {...register("prescription")}
                    rows={2}
                    placeholder="Crèmes, médicaments, examens..."
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl py-3 inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <ClipboardCheck size={16} />
                      Valider la décision
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 font-medium">{value}</span>
    </div>
  );
}

function decisionLabel(d: string): string {
  switch (d) {
    case "traitement_simple": return "Traitement simple";
    case "suivi": return "Surveillance et suivi";
    case "consultation": return "Consultation médicale";
    case "urgence": return "URGENCE";
    default: return d;
  }
}

function WorkspaceSkeleton() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-7xl">
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-2xl bg-white/[0.04]" />
          <Skeleton className="h-12 rounded-xl bg-white/[0.04]" />
          <Skeleton className="h-48 rounded-2xl bg-white/[0.04]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl bg-white/[0.04]" />
          <Skeleton className="h-96 rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
