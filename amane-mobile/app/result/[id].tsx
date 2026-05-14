import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  HelpCircle,
  Info,
  ScanSearch,
  Stethoscope,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { absoluteUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { haptic } from '@/lib/haptics';
import { useConsultation } from '@/lib/queries';
import type { ConsultationDetail, RiskLevel } from '@/lib/types';

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useConsultation(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#34d399" />
        <Text className="text-zinc-400 mt-3">Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center px-8">
        <View className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 items-center justify-center mb-4">
          <AlertCircle size={32} color="#fb7185" />
        </View>
        <Text className="text-zinc-100 font-bold text-lg mt-2">Erreur</Text>
        <Text className="text-zinc-400 text-sm mt-1 text-center">
          {error?.message ?? 'Consultation introuvable.'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-white/[0.06] border border-white/10 rounded-2xl px-6 py-3"
        >
          <Text className="text-zinc-200 font-semibold">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const role = user?.role ?? 'relais';
  const onBack = () => router.replace('/(tabs)');
  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={() => {
        haptic.light();
        refetch();
      }}
      tintColor="#34d399"
    />
  );

  if (role === 'relais') {
    return <RelaisView data={data} onBack={onBack} refreshControl={refreshControl} />;
  }
  if (role === 'infirmier') {
    return <InfirmierView data={data} onBack={onBack} refreshControl={refreshControl} />;
  }
  return <FullView data={data} onBack={onBack} refreshControl={refreshControl} />;
}

// =====================================================================
// VUE RELAIS — hero couleur + action concrète seulement
// =====================================================================
function RelaisView({ data, onBack, refreshControl }: { data: ConsultationDetail; onBack: () => void; refreshControl: React.ReactElement }) {
  const ai = data.ai_result;
  const isOOD = !!ai.is_out_of_distribution;
  const isUncertain = ai.is_uncertain || isOOD;
  const isReviewed = !!data.review;
  const ctx = relaisContext(ai.risk_level, isUncertain, isOOD, isReviewed);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} refreshControl={refreshControl}>
        <TopBar onBack={onBack} title="Cas envoyé" />

        {/* HERO */}
        <Animated.View entering={FadeInDown.duration(600).springify()} className="px-5">
          <View className="rounded-3xl overflow-hidden border border-white/10">
            <LinearGradient
              colors={ctx.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 28, alignItems: 'center' }}
            >
              <View
                className="bg-white/25 rounded-3xl p-4 mb-4"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {ctx.icon}
              </View>
              <Text className="text-white/85 text-[10px] font-bold uppercase tracking-widest mb-2">
                {ctx.label}
              </Text>
              <Text className="text-white text-2xl font-bold text-center tracking-tight">
                {ctx.title}
              </Text>
              <Text className="text-white/85 text-base text-center mt-3 leading-relaxed">
                {ctx.message}
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Patient + dossier */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} className="px-5 mt-5">
          <View className="bg-white/[0.02] rounded-2xl border border-white/10 p-4">
            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              Dossier patient
            </Text>
            <View className="flex-row justify-between py-2 border-b border-white/[0.06]">
              <Text className="text-zinc-400 text-sm">ID anonyme</Text>
              <Text className="text-zinc-100 text-sm font-medium font-mono">
                {data.anonymous_patient_id}
              </Text>
            </View>
            {data.body_area && (
              <View className="flex-row justify-between py-2 border-b border-white/[0.06]">
                <Text className="text-zinc-400 text-sm">Zone</Text>
                <Text className="text-zinc-100 text-sm font-medium">{data.body_area}</Text>
              </View>
            )}
            {data.symptoms_duration && (
              <View className="flex-row justify-between py-2">
                <Text className="text-zinc-400 text-sm">Durée</Text>
                <Text className="text-zinc-100 text-sm font-medium">
                  {data.symptoms_duration}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Décision médecin si validée */}
        {isReviewed && data.review && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mt-5">
            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              Instructions du médecin
            </Text>
            <View className="bg-emerald-500/[0.05] rounded-2xl border border-emerald-500/30 p-4">
              <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1">
                Décision
              </Text>
              <Text className="text-emerald-300 font-semibold text-lg mb-3">
                {decisionLabel(data.review.decision)}
              </Text>
              {data.review.notes && (
                <>
                  <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1 mt-2">
                    Note du Dr. {data.review.medecin_name}
                  </Text>
                  <Text className="text-zinc-200 text-sm leading-relaxed">
                    {data.review.notes}
                  </Text>
                </>
              )}
              {data.review.prescription && (
                <>
                  <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1 mt-3">
                    Prescription
                  </Text>
                  <Text className="text-zinc-200 text-sm leading-relaxed">
                    {data.review.prescription}
                  </Text>
                </>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================================
// VUE INFIRMIER
// =====================================================================
function InfirmierView({ data, onBack, refreshControl }: { data: ConsultationDetail; onBack: () => void; refreshControl: React.ReactElement }) {
  const ai = data.ai_result;
  const isOOD = !!ai.is_out_of_distribution;
  const isUncertain = ai.is_uncertain || isOOD;
  const isReviewed = !!data.review;
  const ctx = relaisContext(ai.risk_level, isUncertain, isOOD, isReviewed);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} refreshControl={refreshControl}>
        <TopBar onBack={onBack} title="Résultat infirmier" />

        <Animated.View entering={FadeInDown.duration(600).springify()} className="px-5">
          <View className="rounded-3xl overflow-hidden border border-white/10">
            <LinearGradient
              colors={ctx.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 22 }}
            >
              <View className="flex-row items-center gap-3 mb-3">
                <View className="bg-white/25 rounded-2xl p-2">{ctx.icon}</View>
                <View className="flex-1">
                  <Text className="text-white/85 text-[10px] font-bold uppercase tracking-widest">
                    {ctx.label}
                  </Text>
                  <Text className="text-white text-xl font-bold mt-0.5 tracking-tight">
                    {ctx.title}
                  </Text>
                </View>
              </View>
              <Text className="text-white/85 text-sm leading-relaxed">{ctx.message}</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Diagnostic IA */}
        {!isOOD && (
          <Animated.View entering={FadeInDown.delay(150).duration(500)} className="px-5 mt-5">
            <View className="bg-white/[0.02] rounded-2xl border border-white/10 p-4">
              <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                Suggestion IA
              </Text>
              <Text className="text-zinc-100 font-semibold text-lg">
                {ai.primary_diagnosis}
              </Text>
              <View className="mt-3">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    Confiance calibrée
                  </Text>
                  <Text className="text-zinc-200 text-xs font-bold tabular-nums">
                    {Math.round(ai.confidence * 100)}%
                  </Text>
                </View>
                <View className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <View
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.round(ai.confidence * 100)}%` }}
                  />
                </View>
              </View>
              <Text className="text-zinc-500 text-xs mt-3 italic">
                Suggestion uniquement. Le médecin valide le diagnostic final.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Patient */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mt-5">
          <View className="bg-white/[0.02] rounded-2xl border border-white/10 p-4">
            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              Dossier patient
            </Text>
            <Text className="text-zinc-100 font-mono text-sm">
              {data.anonymous_patient_id}
            </Text>
            {data.body_area && (
              <Text className="text-zinc-400 text-sm mt-1">
                {data.body_area} · {data.symptoms_duration ?? '—'}
              </Text>
            )}
          </View>
        </Animated.View>

        {isReviewed && data.review && (
          <Animated.View entering={FadeInDown.delay(250).duration(500)} className="px-5 mt-5">
            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              Décision du médecin
            </Text>
            <View className="bg-emerald-500/[0.06] rounded-2xl border border-emerald-500/30 p-4">
              <Text className="text-emerald-300 font-bold">
                {decisionLabel(data.review.decision)}
              </Text>
              {data.review.notes && (
                <Text className="text-emerald-200/80 text-sm mt-2 leading-relaxed">
                  {data.review.notes}
                </Text>
              )}
              {data.review.prescription && (
                <View className="mt-3 pt-3 border-t border-emerald-500/20">
                  <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                    Prescription
                  </Text>
                  <Text className="text-emerald-200/80 text-sm">
                    {data.review.prescription}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================================
// VUE FULL — médecin/admin
// =====================================================================
function FullView({ data, onBack, refreshControl }: { data: ConsultationDetail; onBack: () => void; refreshControl: React.ReactElement }) {
  const ai = data.ai_result;
  const isOOD = !!ai.is_out_of_distribution;
  const isUncertain = ai.is_uncertain || isOOD;
  const ctx = relaisContext(ai.risk_level, isUncertain, isOOD, !!data.review);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const imageUrl = absoluteUrl(data.image_url);
  const heatmapUrl = absoluteUrl(ai.heatmap_url);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} refreshControl={refreshControl}>
        <TopBar onBack={onBack} title="Détail complet" />

        <Animated.View entering={FadeInDown.duration(600).springify()} className="px-5">
          <View className="rounded-3xl overflow-hidden border border-white/10">
            <LinearGradient
              colors={ctx.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 22 }}
            >
              <View className="flex-row items-center gap-3 mb-3">
                <View className="bg-white/25 rounded-2xl p-2">{ctx.icon}</View>
                <View className="flex-1">
                  <Text className="text-white/85 text-[10px] font-bold uppercase tracking-widest">
                    {isOOD ? 'Image atypique' : `Risque ${riskLabel(ai.risk_level)}`}
                  </Text>
                  <Text className="text-white text-xl font-bold mt-0.5 tracking-tight">
                    {isOOD ? "Hors domaine d'entraînement" : ai.primary_diagnosis}
                  </Text>
                </View>
              </View>

              {!isOOD && (
                <View className="bg-white/15 rounded-2xl p-3 mt-2">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white/85 text-[10px] font-bold uppercase tracking-widest">
                      Confiance calibrée
                    </Text>
                    <Text className="text-white text-lg font-bold tabular-nums">
                      {Math.round(ai.confidence * 100)}%
                    </Text>
                  </View>
                  <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-white rounded-full"
                      style={{ width: `${Math.round(ai.confidence * 100)}%` }}
                    />
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-zinc-100 font-semibold text-base">Image analysée</Text>
            <Pressable
              onPress={() => {
                haptic.light();
                setShowHeatmap(!showHeatmap);
              }}
              className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full active:bg-emerald-500/15"
            >
              {showHeatmap ? (
                <Eye size={14} color="#34d399" />
              ) : (
                <EyeOff size={14} color="#34d399" />
              )}
              <Text className="text-emerald-300 text-xs font-semibold">
                {showHeatmap ? 'Masquer' : 'Afficher'}
              </Text>
            </Pressable>
          </View>

          <View className="rounded-3xl overflow-hidden bg-zinc-900 aspect-square relative border border-white/10">
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            )}
            {showHeatmap && heatmapUrl && (
              <Animated.View entering={FadeIn.duration(200)} className="absolute inset-0">
                <Image
                  source={{ uri: heatmapUrl }}
                  style={{ width: '100%', height: '100%', opacity: 0.85 }}
                  contentFit="cover"
                />
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {!isOOD && ai.alternatives.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mt-6">
            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              Alternatives
            </Text>
            <View className="bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
              {ai.alternatives.map((alt, i) => (
                <View
                  key={i}
                  className={`px-4 py-3 ${
                    i < ai.alternatives.length - 1 ? 'border-b border-white/[0.06]' : ''
                  }`}
                >
                  <View className="flex-row justify-between mb-1.5">
                    <Text className="text-zinc-200 text-sm flex-1">{alt.label}</Text>
                    <Text className="text-zinc-500 text-xs font-semibold tabular-nums">
                      {Math.round(alt.score * 100)}%
                    </Text>
                  </View>
                  <View className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${Math.max(2, Math.round(alt.score * 100))}%`,
                        height: '100%',
                        borderRadius: 99,
                        backgroundColor:
                          alt.score >= 0.5 ? '#8b5cf6' :
                          alt.score >= 0.25 ? '#3b82f6' : '#3f3f46',
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TopBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View className="px-5 pt-2 pb-3 flex-row items-center">
      <Pressable
        onPress={() => {
          haptic.light();
          onBack();
        }}
        className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 items-center justify-center active:bg-white/[0.08]"
      >
        <ArrowLeft size={20} color="#d4d4d8" />
      </Pressable>
      <Text className="text-zinc-100 font-bold text-base ml-3">{title}</Text>
    </View>
  );
}

// =====================================================================
// HELPERS
// =====================================================================
type RelaisCtx = {
  colors: readonly [string, string];
  icon: React.ReactNode;
  label: string;
  title: string;
  message: string;
};

function relaisContext(
  risk: RiskLevel | null | undefined,
  uncertain: boolean,
  ood: boolean,
  reviewed: boolean,
): RelaisCtx {
  if (ood) {
    return {
      colors: ['#7e22ce', '#a855f7'],
      icon: <ScanSearch size={32} color="white" strokeWidth={2.5} />,
      label: 'Image atypique',
      title: 'Le médecin doit examiner cette image',
      message:
        "L'IA n'a pas reconnu cette image dans son domaine d'entraînement. " +
        "Un médecin va l'examiner manuellement.",
    };
  }
  if (reviewed) {
    return {
      colors: ['#047857', '#10b981'],
      icon: <CheckCircle2 size={32} color="white" strokeWidth={2.5} />,
      label: 'Décision prise',
      title: 'Le médecin a validé le cas',
      message: 'Voir les instructions ci-dessous.',
    };
  }
  if (uncertain) {
    return {
      colors: ['#7e22ce', '#a855f7'],
      icon: <Stethoscope size={32} color="white" strokeWidth={2.5} />,
      label: 'En attente du médecin',
      title: 'Cas envoyé pour validation',
      message:
        'Un médecin spécialiste va examiner ce cas. Vous recevrez une décision dès que possible.',
    };
  }
  switch (risk) {
    case 'CRITICAL':
      return {
        colors: ['#9f1239', '#ef4444'],
        icon: <AlertCircle size={32} color="white" strokeWidth={2.5} />,
        label: 'Risque critique',
        title: 'Consultation urgente recommandée',
        message:
          'Si signes vitaux (saignement, douleur intense), appelez le 15. Sinon, dirigez le patient vers un médecin sous 24h.',
      };
    case 'HIGH':
      return {
        colors: ['#92400e', '#f59e0b'],
        icon: <AlertTriangle size={32} color="white" strokeWidth={2.5} />,
        label: 'Risque élevé',
        title: 'Consultation médicale sous 7 jours',
        message:
          'Le médecin va examiner le cas en priorité. Le patient doit consulter dans la semaine.',
      };
    case 'MEDIUM':
      return {
        colors: ['#1e40af', '#3b82f6'],
        icon: <Info size={32} color="white" strokeWidth={2.5} />,
        label: 'Risque modéré',
        title: 'Le médecin va donner un avis',
        message: "Pas d'urgence immédiate. Le patient sera contacté avec les instructions.",
      };
    case 'LOW':
      return {
        colors: ['#047857', '#10b981'],
        icon: <Heart size={32} color="white" strokeWidth={2.5} />,
        label: 'Risque faible',
        title: "Surveillez l'évolution",
        message:
          'Pas de signe inquiétant. Refaites une photo si la lésion change de taille, forme ou couleur.',
      };
    default:
      return {
        colors: ['#3f3f46', '#71717a'],
        icon: <HelpCircle size={32} color="white" strokeWidth={2.5} />,
        label: 'Analyse',
        title: 'Cas envoyé',
        message: 'Le médecin examinera le cas dès que possible.',
      };
  }
}

function riskLabel(level: RiskLevel | null | undefined): string {
  switch (level) {
    case 'LOW': return 'faible';
    case 'MEDIUM': return 'modéré';
    case 'HIGH': return 'élevé';
    case 'CRITICAL': return 'critique';
    default: return 'inconnu';
  }
}

function decisionLabel(decision: string): string {
  switch (decision) {
    case 'traitement_simple': return 'Traitement simple';
    case 'suivi': return 'Surveillance et suivi';
    case 'consultation': return 'Consultation médicale recommandée';
    case 'urgence': return 'URGENCE — Consultation immédiate';
    default: return decision;
  }
}
