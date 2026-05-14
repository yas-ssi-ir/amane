import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/auth-store';
import { haptic } from '@/lib/haptics';
import { LANGUAGES, useI18n, useT } from '@/lib/i18n';
import { loginSchema, type LoginInput } from '@/lib/schemas';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const { lang, setLang } = useI18n();
  const t = useT();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  // Subtle pulse animation pour le glow
  const glowOpacity = useSharedValue(0.5);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  if (glowOpacity.value === 0.5) {
    glowOpacity.value = withRepeat(
      withTiming(0.9, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }

  if (!hydrated) return null;
  if (token) return <Redirect href="/(tabs)" />;

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data.username, data.password);
      haptic.success();
      router.replace('/(tabs)');
    } catch (e: any) {
      haptic.error();
      setServerError(e.message ?? 'Erreur de connexion');
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Background animé : grid + glow pulse */}
      <View className="absolute inset-0">
        {/* Glow emerald top-center */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -SCREEN_H * 0.15,
              left: SCREEN_W / 2 - 250,
              width: 500,
              height: 400,
              borderRadius: 250,
              backgroundColor: 'rgba(16,185,129,0.18)',
            },
            glowStyle,
          ]}
        />
        {/* Glow blue bottom */}
        <View
          style={{
            position: 'absolute',
            bottom: -150,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: 200,
            backgroundColor: 'rgba(59,130,246,0.08)',
          }}
        />
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo + title */}
            <Animated.View
              entering={FadeInDown.duration(700).springify()}
              className="items-center mb-12 px-6"
            >
              <Image
                source={require('../assets/images/icon.png')}
                style={{ width: 96, height: 96, marginBottom: 24 }}
                contentFit="contain"
              />

              <Text className="text-zinc-50 text-5xl font-bold tracking-tight">AMANE</Text>
              <Text className="text-zinc-500 mt-3 text-base text-center max-w-[280px]">
                {t('login_tagline')}
              </Text>

              {/* Language selector */}
              <View className="flex-row gap-2 mt-4">
                {LANGUAGES.map((l) => (
                  <Pressable
                    key={l.code}
                    onPress={() => { haptic.selection(); setLang(l.code); }}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                      backgroundColor: lang === l.code ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                      borderWidth: 1, borderColor: lang === l.code ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Text style={{ fontSize: 13, color: lang === l.code ? '#34d399' : '#71717a', fontWeight: '600' }}>
                      {l.flag} {l.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Form card */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(700).springify()}
              className="px-5"
            >
              <View
                className="bg-white/[0.03] border border-white/10 rounded-3xl p-6"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 8 },
                  shadowRadius: 24,
                  elevation: 8,
                }}
              >
                <Text className="text-zinc-100 text-xl font-semibold mb-1">{t('login_welcome')}</Text>
                <Text className="text-zinc-500 mb-6 text-sm">{t('login_subtitle')}</Text>

                {/* Username */}
                <View className="mb-4">
                  <Text className="text-zinc-300 font-medium mb-2 text-xs uppercase tracking-widest">
                    {t('login_username')}
                  </Text>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder={t('login_username_ph')}
                        placeholderTextColor="#52525b"
                        autoCapitalize="none"
                        autoCorrect={false}
                        className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-4 text-base text-zinc-100"
                      />
                    )}
                  />
                  {errors.username && (
                    <Text className="text-rose-400 text-xs mt-1.5 ml-1">
                      {errors.username.message}
                    </Text>
                  )}
                </View>

                {/* Password */}
                <View className="mb-2">
                  <Text className="text-zinc-300 font-medium mb-2 text-xs uppercase tracking-widest">
                    {t('login_password')}
                  </Text>
                  <View className="relative">
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { value, onChange, onBlur } }) => (
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="••••••••"
                          placeholderTextColor="#52525b"
                          secureTextEntry={!showPwd}
                          className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-4 pr-12 text-base text-zinc-100"
                        />
                      )}
                    />
                    <Pressable
                      onPress={() => {
                        haptic.selection();
                        setShowPwd(!showPwd);
                      }}
                      className="absolute right-4 top-0 bottom-0 justify-center"
                      hitSlop={10}
                    >
                      {showPwd ? (
                        <EyeOff size={20} color="#71717a" />
                      ) : (
                        <Eye size={20} color="#71717a" />
                      )}
                    </Pressable>
                  </View>
                  {errors.password && (
                    <Text className="text-rose-400 text-xs mt-1.5 ml-1">
                      {errors.password.message}
                    </Text>
                  )}
                </View>

                {serverError && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 mt-4 flex-row items-start"
                  >
                    <View className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 mr-2" />
                    <Text className="text-rose-300 text-sm flex-1">{serverError}</Text>
                  </Animated.View>
                )}

                {/* Submit button */}
                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="mt-6 rounded-2xl overflow-hidden active:opacity-80"
                >
                  <LinearGradient
                    colors={isSubmitting ? ['#34d399', '#34d399'] : ['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#09090b" />
                    ) : (
                      <>
                        <Text className="text-zinc-950 font-bold text-base">{t('login_submit')}</Text>
                        <ArrowRight size={18} color="#09090b" strokeWidth={2.5} />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* Register link */}
                <Pressable onPress={() => router.push('/register')} className="mt-4 items-center">
                  <Text className="text-zinc-500 text-sm">
                    Pas encore de compte ?{' '}
                    <Text className="text-emerald-400 font-semibold">Créer un compte</Text>
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
