import { Text, View } from 'react-native';

interface RecapRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

export function RecapRow({ label, value, isLast }: RecapRowProps) {
  return (
    <View
      className={`flex-row justify-between py-2.5 ${
        !isLast ? 'border-b border-white/[0.06]' : ''
      }`}
    >
      <Text className="text-zinc-500 text-sm">{label}</Text>
      <Text className="text-zinc-100 text-sm font-medium">{value}</Text>
    </View>
  );
}
