import { Camera } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function CameraOverlayGuide() {
  const pulse = useSharedValue(0);
  pulse.value = withRepeat(
    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
    -1,
    true,
  );
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.4,
    transform: [{ scale: 0.95 + pulse.value * 0.05 }],
  }));

  return (
    <View className="rounded-3xl bg-zinc-900 aspect-square mb-4 overflow-hidden border border-white/10 items-center justify-center">
      <View className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-emerald-400/60 rounded-tl-lg" />
      <View className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-emerald-400/60 rounded-tr-lg" />
      <View className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-emerald-400/60 rounded-bl-lg" />
      <View className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-emerald-400/60 rounded-br-lg" />

      <Animated.View style={pulseStyle} className="items-center">
        <View className="w-24 h-24 rounded-3xl bg-white/[0.06] border border-emerald-500/20 items-center justify-center mb-3">
          <Camera size={44} color="#34d399" strokeWidth={1.5} />
        </View>
        <Text className="text-zinc-500 text-sm">Centrez la lésion</Text>
      </Animated.View>
    </View>
  );
}
