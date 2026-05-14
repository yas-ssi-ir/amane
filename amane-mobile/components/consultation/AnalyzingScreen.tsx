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
    opacity: 0.4 + pulse.value * 0.6,
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  return (
    <SafeAreaView style={s.root}>
      <View style={s.center}>
        {/* Cercle pulsant en fond */}
        <Animated.View style={[s.pulse, pulseStyle]} />

        {/* Icône spinner centrale */}
        <View style={s.iconBox}>
          <ActivityIndicator size="large" color="#34d399" />
        </View>

        {/* Titre */}
        <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={s.title}>
          {t('new_analyzing')}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(300).duration(500)} style={s.subtitle}>
          {t('new_analyzing_sub')}
        </Animated.Text>

        {/* Étapes */}
        <View style={s.steps}>
          <ProgressItem text={t('new_step_image')} done delay={0} />
          <ProgressItem text={t('new_step_resnet')} loading delay={200} />
          <ProgressItem text={t('new_step_heatmap')} delay={400} />
          <ProgressItem text={t('new_step_gemini')} delay={600} />
        </View>
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
      <View style={[s.circle, circleStyle]}>
        {done ? (
          <CheckCircle2 size={16} color="#34d399" strokeWidth={2.5} />
        ) : loading ? (
          <ActivityIndicator size="small" color="#34d399" />
        ) : (
          <View style={s.dot} />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  pulse: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#f4f4f5',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 20,
  },
  steps: {
    marginTop: 40,
    gap: 14,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circle: {
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
  dot: {
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
