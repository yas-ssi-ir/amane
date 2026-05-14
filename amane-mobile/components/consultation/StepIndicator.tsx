import { View } from 'react-native';

interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <View className="px-5 pt-3 pb-3 flex-row justify-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <View
          key={s}
          className={`h-1.5 rounded-full ${
            s === current
              ? 'bg-emerald-400 w-10'
              : s < current
              ? 'bg-emerald-600 w-5'
              : 'bg-white/10 w-5'
          }`}
          style={{
            transform: [{ scale: s === current ? 1 : 0.95 }],
          }}
        />
      ))}
    </View>
  );
}
