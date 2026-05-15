import { CheckCircle2 } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AnalyzingScreenProps {
  t: (k: string) => string;
}

export function AnalyzingScreen({ t }: AnalyzingScreenProps) {
  const pulse = useSharedValue(0);
  pulse.value = withRepeat(
    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
    -1,
    true,
  );
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.55,
    transform: [{ scale: 1 + pulse.value * 0.07 }],
  }));

  return (
    <SafeAreaView style={s.root}>
      {/* Grand cercle pulsant en haut */}
      <View style={s.topSection}>
        <Animated.View style={[s.circle, pulseStyle]}>
          <ActivityIndicator size="large" color="#34d399" />
        </Animated.View>
      </View>

      {/* Étapes centrées dans l'espace restant */}
      <View style={s.stepsSection}>
        <ProgressItem text={t('new_step_image')} done delay={0} />
        <ProgressItem text={t('new_step_resnet')} loading delay={200} />
        <ProgressItem text={t('new_step_heatmap')} delay={400} />
        <ProgressItem text={t('new_step_gemini')} delay={600} />
      </View>
    </SafeAreaView>
  );
}

interface ProgressItemProps {
  text: string;
  done?: boolean;
  loading?: boolean;
  delay: number;
}

function ProgressItem({ text, done, loading, delay }: ProgressItemProps) {
  const circleStyle = done
    ? s.circleDone
    : loading
    ? s.circleLoading
    : s.circleIdle;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={s.row}>
      <View style={[s.dot, circleStyle]}>
        {done ? (
          <CheckCircle2 size={16} color="#34d399" strokeWidth={2.5} />
        ) : loading ? (
          <ActivityIndicator size="small" color="#34d399" />
        ) : (
          <View style={s.dotInner} />
        )}
      </View>
      <Text style={[s.stepText, done || loading ? s.stepTextActive : s.stepTextIdle]}>
        {text}
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 56,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16,185,129,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
  },
  circleDone: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.35)',
  },
  circleLoading: {
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderColor: 'rgba(52,211,153,0.25)',
  },
  circleIdle: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#52525b',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  stepTextActive: {
    color: '#f4f4f5',
    fontWeight: '600',
  },
  stepTextIdle: {
    color: '#71717a',
  },
});
