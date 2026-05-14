import { Pressable, Text } from 'react-native';

interface ChipProps {
  children: React.ReactNode;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}

export function Chip({ children, active, onPress, small }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border ${small ? 'px-3 py-1.5' : 'px-4 py-2'} ${
        active
          ? 'bg-emerald-500/15 border-emerald-500/40'
          : 'bg-white/[0.04] border-white/10'
      } active:bg-white/[0.06]`}
    >
      <Text
        className={`${small ? 'text-xs' : 'text-sm'} font-medium ${
          active ? 'text-emerald-300' : 'text-zinc-300'
        }`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
