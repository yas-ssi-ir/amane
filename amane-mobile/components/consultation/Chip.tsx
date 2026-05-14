import { Pressable, StyleSheet, Text } from 'react-native';

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
      style={({ pressed }) => [
        s.base,
        small ? s.small : s.normal,
        active ? s.active : s.inactive,
        pressed && s.pressed,
      ]}
    >
      <Text style={[s.text, small && s.textSmall, active ? s.textActive : s.textInactive]}>
        {children}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  normal: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  small: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  active: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(52,211,153,0.4)',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 3,
  },
  inactive: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.09)',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 11,
  },
  textActive: {
    color: '#34d399',
    fontSize: 13,
  },
  textInactive: {
    color: '#a1a1aa',
    fontSize: 13,
  },
});
