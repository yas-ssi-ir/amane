import { CheckCircle2 } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: 'rgba(16,185,129,0.2)',
            },
            pulseStyle,
          ]}
        />

        <View
          className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}
        >
          <ActivityIndicator size="large" color="#34d399" />
        </View>

        <Animated.Text entering={FadeInDown.delay(200).duration(500)} className="text-zinc-100 text-2xl font-bold text-center">
          {t('new_analyzing')}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(300).duration(500)} className="text-zinc-400 text-base mt-2 text-center max-w-xs">
          {t('new_analyzing_sub')}
        </Animated.Text>

        <View className="mt-12 gap-3 w-full">
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
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      className="flex-row items-center gap-3"
    >
      <View
        style={{ width: 32, height: 32, flexShrink: 0 }}
        className={`rounded-full items-center justify-center ${
          done
            ? 'bg-emerald-500/15 border border-emerald-500/40'
            : loading
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-white/[0.04] border border-white/10'
        }`}
      >
        {done ? (
          <CheckCircle2 size={16} color="#34d399" strokeWidth={2.5} />
        ) : loading ? (
          <ActivityIndicator size="small" color="#34d399" />
        ) : (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#52525b' }} />
        )}
      </View>
      <Text
        style={{ flex: 1 }}
        className={`text-sm ${done || loading ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}
      >
        {text}
      </Text>
    </Animated.View>
  );
}
