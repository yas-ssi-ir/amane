import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface StepIndicatorProps {
  current: number;
  total: number;
}

const LABELS = ['Photo', 'Patient', 'Symptômes', 'Envoi'];

export function StepIndicator({ current, total }: StepIndicatorProps) {
  const pulse = useSharedValue(0.6);
  pulse.value = withRepeat(
    withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
    -1,
    true,
  );
  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.55,
    transform: [{ scale: 0.85 + pulse.value * 0.25 }],
  }));

  return (
    <View style={s.container}>
      <View style={s.row}>
        {Array.from({ length: total }, (_, i) => i + 1).map((step, idx) => {
          const isDone = step < current;
          const isActive = step === current;
          return (
            <React.Fragment key={step}>
              {/* Step node */}
              <View style={s.node}>
                {/* Pulsing glow ring on active */}
                {isActive && (
                  <Animated.View style={[s.glowRing, glowStyle]} />
                )}
                {/* Circle */}
                <View style={[
                  s.circle,
                  isDone && s.circleDone,
                  isActive && s.circleActive,
                ]}>
                  {isDone ? (
                    <CheckCircle2 size={13} color="#fff" strokeWidth={3} />
                  ) : (
                    <Text style={[s.num, isActive && s.numActive]}>{step}</Text>
                  )}
                </View>
                {/* Label */}
                <Text style={[s.label, isActive && s.labelActive, isDone && s.labelDone]}>
                  {LABELS[idx]}
                </Text>
              </View>

              {/* Connector */}
              {idx < total - 1 && (
                <View style={s.connectorWrap}>
                  <View style={[s.connector, isDone && s.connectorDone]} />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  node: {
    alignItems: 'center',
    width: 52,
  },
  glowRing: {
    position: 'absolute',
    top: -8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.22)',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.11)',
  },
  circleDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  circleActive: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
    shadowColor: '#10b981',
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 8,
  },
  num: {
    color: '#3f3f46',
    fontSize: 13,
    fontWeight: '700',
  },
  numActive: {
    color: '#ffffff',
  },
  label: {
    color: '#3f3f46',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  labelActive: {
    color: '#34d399',
  },
  labelDone: {
    color: '#059669',
  },
  connectorWrap: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 2,
  },
  connector: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  connectorDone: {
    backgroundColor: '#059669',
  },
});
