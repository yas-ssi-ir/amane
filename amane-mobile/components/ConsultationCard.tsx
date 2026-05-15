import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { absoluteUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { haptic } from '@/lib/haptics';
import type { ConsultationListItem, RiskLevel } from '@/lib/types';
import { RiskBadge } from './RiskBadge';

interface Props {
  consultation: ConsultationListItem;
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Envoyé',
  ai_analyzed: 'En attente médecin',
  pending_review: 'En attente médecin',
  validated: 'Validé',
  rejected: 'Rejeté',
  escalated: 'Urgence escaladée',
};

const RISK_STRIPE: Record<RiskLevel, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#3b82f6',
  LOW: '#10b981',
};

export function ConsultationCard({ consultation: c }: Props) {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role ?? 'relais');
  const isRelais = role === 'relais';
  const imageUrl = absoluteUrl(c.image_url);
  const stripeColor = isRelais ? '#3f3f46' : (c.ai_is_ood ? '#10b981' : (c.ai_risk_level ? RISK_STRIPE[c.ai_risk_level as RiskLevel] : '#3f3f46'));
  const isValidated = c.status === 'validated' || c.status === 'escalated';

  return (
    <Pressable
      onPress={() => {
        haptic.light();
        router.push(`/result/${c.id}`);
      }}
      className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden mb-3 active:bg-white/[0.04] active:border-white/20"
    >
      <View className="flex-row">
        {/* Thumbnail */}
        <View className="w-[88px] h-[88px] bg-zinc-900">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 88, height: 88 }}
              contentFit="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <View className="w-8 h-8 rounded-xl bg-white/[0.06]" />
            </View>
          )}
        </View>

        <View className="flex-1 p-3">
          <View className="flex-row items-start justify-between mb-1">
            <Text
              className="text-zinc-100 font-semibold text-sm flex-1 mr-2"
              numberOfLines={1}
            >
              {isRelais
                ? (isValidated ? 'Décision reçue' : 'En attente du médecin')
                : (c.ai_prediction ?? 'Analyse en cours...')}
            </Text>
            {!isRelais && (
              <RiskBadge
                level={c.ai_risk_level}
                isUncertain={c.status === 'ai_analyzed' && c.ai_confidence != null && c.ai_confidence < 0.66}
                size="sm"
              />
            )}
          </View>

          {!isRelais && c.ai_confidence != null && (
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <View className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <View
                  style={{
                    width: `${Math.round(c.ai_confidence * 100)}%`,
                    height: '100%',
                    backgroundColor: stripeColor,
                    opacity: 0.7,
                    borderRadius: 99,
                  }}
                />
              </View>
              <Text className="text-zinc-500 text-[10px] tabular-nums">
                {Math.round(c.ai_confidence * 100)}%
              </Text>
            </View>
          )}

          <Text className="text-zinc-400 text-xs" numberOfLines={1}>
            {c.symptoms}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            {isValidated && (
              <CheckCircle2 size={10} color="#34d399" strokeWidth={2.5} />
            )}
            <Text
              numberOfLines={1}
              style={{ fontSize: 10, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase', color: isValidated ? '#10b981' : '#71717a', marginLeft: isValidated ? 3 : 0 }}
            >
              {STATUS_LABEL[c.status] ?? c.status}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

