import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Camera,
  ChevronRight,
  FileText,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { useMemo } from 'react';
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

import { ConsultationCard } from '@/components/ConsultationCard';
import { useAuthStore } from '@/lib/auth-store';
import { haptic } from '@/lib/haptics';
import { getGreeting, useI18n, useT } from '@/lib/i18n';
import { useConsultations } from '@/lib/queries';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: consultations, isLoading, refetch, isRefetching } = useConsultations();
  const t = useT();
  const { lang } = useI18n();

  const stats = useMemo(() => {
    if (!consultations) return { total: 0, pending: 0, validated: 0 };
    return {
      total: consultations.length,
      pending: consultations.filter((c) => c.status === 'ai_analyzed').length,
      validated: consultations.filter((c) => c.status === 'validated').length,
    };
  }, [consultations]);

  const greeting = getGreeting(lang);
  const firstName = user?.full_name?.split(' ')[0] ?? '';

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              haptic.light();
              refetch();
            }}
            tintColor="#34d399"
          />
        }
      >
        {/* Hero greeting card */}
        <Animated.View entering={FadeInDown.duration(500).springify()} className="px-5 pt-4">
          <View className="rounded-3xl overflow-hidden border border-white/10">
            <LinearGradient
              colors={['#064e3b', '#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 22 }}
            >
              <View className="flex-row items-center gap-2 mb-1">
                <Sparkles size={14} color="rgba(255,255,255,0.85)" />
                <Text className="text-emerald-50/85 text-xs font-medium tracking-wide">
                  {greeting}
                </Text>
              </View>
              <Text className="text-white text-2xl font-bold tracking-tight">
                {firstName}
              </Text>
              <Text className="text-emerald-50/80 text-sm mt-1 mb-5">
                {t('ready')}
              </Text>

              <View className="flex-row gap-2">
                <MiniStat label={t('total')} value={stats.total} />
                <MiniStat label={t('pending')} value={stats.pending} />
                <MiniStat label={t('validated')} value={stats.validated} />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* CTA Nouvelle consultation */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} className="px-5 mt-4">
          <Pressable
            onPress={() => {
              haptic.medium();
              router.push('/(tabs)/new');
            }}
            className="rounded-2xl overflow-hidden active:opacity-80"
          >
            <View className="bg-white/[0.03] border border-white/10 p-4 flex-row items-center">
              <LinearGradient
                colors={['#34d399', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Camera size={26} color="#09090b" strokeWidth={2.5} />
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-zinc-100 font-semibold text-base">
                  {t('new_consultation')}
                </Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  {t('new_consultation_sub')}
                </Text>
              </View>
              <ChevronRight size={22} color="#52525b" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Section Mes consultations */}
        <View className="px-5 mt-8">
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
            className="flex-row items-center justify-between mb-3"
          >
            <View>
              <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                {t('history')}
              </Text>
              <Text className="text-zinc-100 font-semibold text-lg">{t('my_consultations')}</Text>
            </View>
            {consultations && consultations.length > 0 && (
              <Pressable
                onPress={() => {
                  haptic.light();
                  refetch();
                }}
                hitSlop={10}
                className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 items-center justify-center"
              >
                <RefreshCw size={14} color="#a1a1aa" />
              </Pressable>
            )}
          </Animated.View>

          {isLoading ? (
            <View className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 items-center">
              <ActivityIndicator color="#34d399" />
              <Text className="text-zinc-500 text-sm mt-2">{t('loading')}</Text>
            </View>
          ) : !consultations || consultations.length === 0 ? (
            <EmptyState t={t} />
          ) : (
            consultations.map((c, i) => (
              <Animated.View
                key={c.id}
                entering={FadeInDown.delay(300 + i * 60).duration(400)}
              >
                <ConsultationCard consultation={c} />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 bg-white/15 backdrop-blur rounded-2xl p-3">
      <Text className="text-white text-2xl font-bold tabular-nums">{value}</Text>
      <Text className="text-emerald-50/80 text-[11px] mt-0.5">{label}</Text>
    </View>
  );
}

function EmptyState({ t }: { t: (k: string) => string }) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="bg-white/[0.02] border border-white/10 rounded-2xl p-10 items-center"
    >
      <View className="w-16 h-16 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 items-center justify-center mb-4 border border-emerald-500/20">
        <FileText size={32} color="#34d399" strokeWidth={1.5} />
      </View>
      <Text className="text-zinc-100 font-semibold text-base mb-1">{t('no_consultations')}</Text>
      <Text className="text-zinc-500 text-sm text-center max-w-xs">
        {t('no_consultations_sub')}
      </Text>
    </Animated.View>
  );
}

