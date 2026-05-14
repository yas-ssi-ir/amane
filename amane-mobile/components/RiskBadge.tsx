import { AlertCircle, AlertTriangle, CheckCircle2, Info, Search } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { RiskLevel } from '@/lib/types';

interface Props {
  level: RiskLevel | null | undefined;
  isUncertain?: boolean;
  size?: 'sm' | 'md';
}

const CONFIG: Record<RiskLevel, { label: string; bg: string; fg: string; iconColor: string; Icon: any }> = {
  LOW: {
    label: 'Faible',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    fg: 'text-emerald-300',
    iconColor: '#34d399',
    Icon: CheckCircle2,
  },
  MEDIUM: {
    label: 'Modéré',
    bg: 'bg-blue-500/10 border-blue-500/30',
    fg: 'text-blue-300',
    iconColor: '#60a5fa',
    Icon: Info,
  },
  HIGH: {
    label: 'Élevé',
    bg: 'bg-amber-500/10 border-amber-500/30',
    fg: 'text-amber-300',
    iconColor: '#fbbf24',
    Icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'Critique',
    bg: 'bg-rose-500/10 border-rose-500/30',
    fg: 'text-rose-300',
    iconColor: '#fb7185',
    Icon: AlertCircle,
  },
};

export function RiskBadge({ level, isUncertain, size = 'md' }: Props) {
  if (isUncertain) {
    return (
      <View className={`flex-row items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 ${size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}>
        <Search size={size === 'sm' ? 11 : 13} color="#a78bfa" strokeWidth={2.5} />
        <Text className={`text-violet-300 font-semibold ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
          Médecin
        </Text>
      </View>
    );
  }

  if (!level) return null;
  const cfg = CONFIG[level];
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <View className={`flex-row items-center gap-1.5 rounded-full border ${cfg.bg} ${size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}>
      <cfg.Icon size={iconSize} color={cfg.iconColor} strokeWidth={2.5} />
      <Text className={`${cfg.fg} font-semibold ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
        {cfg.label}
      </Text>
    </View>
  );
}
