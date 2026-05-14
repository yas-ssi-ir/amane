import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyzingScreen } from '@/components/consultation/AnalyzingScreen';
import { Step1Image } from '@/components/consultation/Step1Image';
import { Step2Patient } from '@/components/consultation/Step2Patient';
import { Step3Symptoms } from '@/components/consultation/Step3Symptoms';
import { Step4Confirm } from '@/components/consultation/Step4Confirm';
import { StepIndicator } from '@/components/consultation/StepIndicator';
import type { FormState } from '@/components/consultation/types';
import { useAuthStore } from '@/lib/auth-store';
import { haptic } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useCreateConsultation } from '@/lib/queries';
import type { Gender } from '@/lib/types';

export default function NewConsultationScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createMutation = useCreateConsultation();
  const t = useT();

  const GENDERS: { value: Gender; label: string }[] = [
    { value: 'M', label: t('new_gender_m') },
    { value: 'F', label: t('new_gender_f') },
    { value: 'AUTRE', label: t('new_gender_other') },
  ];

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    imageUri: null, imageMime: null, imageName: null,
    videoUri: null, videoMime: null, videoName: null,
    age_range: null, gender: null,
    region: user?.region ?? 'Casablanca-Settat',
    health_coverage: null,
    zone_type: null,
    latitude: null,
    longitude: null,
    body_area: '', symptoms_duration: '', symptoms: '',
  });

  const update = (patch: Partial<FormState>) => setForm((p) => ({ ...p, ...patch }));

  const canNext = step === 1 ? !!form.imageUri
    : step === 2 ? !!form.age_range && !!form.gender && !!form.region
    : step === 3 ? !!form.body_area && !!form.symptoms_duration && form.symptoms.length >= 5
    : true;

  const pickFromCamera = async () => {
    haptic.medium();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "Activez l'accès à la caméra dans vos paramètres."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0]; haptic.success();
      update({ imageUri: a.uri, imageMime: a.mimeType ?? 'image/jpeg', imageName: a.fileName ?? `photo-${Date.now()}.jpg` });
    }
  };

  const pickFromGallery = async () => {
    haptic.light();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted' && Platform.OS !== 'web') { Alert.alert('Permission refusée', "Activez l'accès aux photos dans vos paramètres."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0]; haptic.success();
      update({ imageUri: a.uri, imageMime: a.mimeType ?? 'image/jpeg', imageName: a.fileName ?? `photo-${Date.now()}.jpg` });
    }
  };

  const recordVideo = async () => {
    haptic.medium();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "Activez l'accès à la caméra dans vos paramètres."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 60, videoQuality: 1 as any, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0]; haptic.success();
      update({ videoUri: a.uri, videoMime: a.mimeType ?? 'video/mp4', videoName: a.fileName ?? `video-${Date.now()}.mp4` });
    }
  };

  const pickVideoFromGallery = async () => {
    haptic.light();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted' && Platform.OS !== 'web') { Alert.alert('Permission refusée', "Activez l'accès aux vidéos dans vos paramètres."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], videoMaxDuration: 60, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0]; haptic.success();
      update({ videoUri: a.uri, videoMime: a.mimeType ?? 'video/mp4', videoName: a.fileName ?? `video-${Date.now()}.mp4` });
    }
  };

  const handleSubmit = async () => {
    if (!form.imageUri || !form.age_range || !form.gender) return;
    haptic.medium();
    const fd = new FormData();
    fd.append('symptoms', form.symptoms);
    fd.append('symptoms_duration', form.symptoms_duration);
    fd.append('body_area', form.body_area);
    fd.append('age_range', form.age_range);
    fd.append('gender', form.gender);
    fd.append('region', form.region);
    if (form.health_coverage) fd.append('health_coverage', form.health_coverage);
    if (form.zone_type) fd.append('zone_type', form.zone_type);
    if (form.latitude != null) fd.append('latitude', String(form.latitude));
    if (form.longitude != null) fd.append('longitude', String(form.longitude));

    if (Platform.OS === 'web') {
      const blob = await (await fetch(form.imageUri)).blob();
      fd.append('file', blob, form.imageName ?? 'photo.jpg');
    } else {
      fd.append('file', { uri: form.imageUri, name: form.imageName ?? 'photo.jpg', type: form.imageMime ?? 'image/jpeg' } as any);
    }

    if (form.videoUri) {
      if (Platform.OS === 'web') {
        const blob = await (await fetch(form.videoUri)).blob();
        fd.append('video', blob, form.videoName ?? 'video.mp4');
      } else {
        fd.append('video', { uri: form.videoUri, name: form.videoName ?? 'video.mp4', type: form.videoMime ?? 'video/mp4' } as any);
      }
    }

    setIsSubmitting(true);
    try {
      const result = await createMutation.mutateAsync(fd);
      haptic.success();
      router.replace(`/result/${result.consultation_id}`);
    } catch (e: any) {
      setIsSubmitting(false);
      haptic.error();
      Alert.alert(t('error'), e.message ?? t('send_fail'));
    }
  };

  if (isSubmitting || createMutation.isPending) return <AnalyzingScreen t={t} />;

  return (
    // LinearGradient AS root → guaranteed visible on all platforms
    <LinearGradient
      colors={['#0d2318', '#071209', '#030806']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.root}
    >
      {/* Corner accent glows */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['rgba(16,185,129,0.35)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.accentTL}
        />
        <LinearGradient
          colors={['rgba(5,150,105,0.25)', 'transparent']}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={s.accentBR}
        />
        <View style={s.decorLine} />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          <StepIndicator current={step} total={4} />

          <ScrollView
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View key={step} entering={FadeInRight.duration(280).springify()}>
              {step === 1 && (
                <Step1Image
                  form={form} t={t}
                  onCamera={pickFromCamera} onGallery={pickFromGallery}
                  onClear={() => { haptic.light(); update({ imageUri: null, imageMime: null, imageName: null }); }}
                  onRecordVideo={recordVideo} onPickVideo={pickVideoFromGallery}
                  onClearVideo={() => { haptic.light(); update({ videoUri: null, videoMime: null, videoName: null }); }}
                />
              )}
              {step === 2 && <Step2Patient form={form} update={update} t={t} GENDERS={GENDERS} />}
              {step === 3 && <Step3Symptoms form={form} update={update} t={t} />}
              {step === 4 && <Step4Confirm form={form} t={t} />}
            </Animated.View>
          </ScrollView>

          {/* ── Bottom nav ── */}
          <View style={s.bottomBar}>
            {step > 1 && (
              <Pressable
                onPress={() => { haptic.light(); setStep(step - 1); }}
                style={s.backBtn}
              >
                <ArrowLeft size={20} color="#a1a1aa" strokeWidth={2} />
              </Pressable>
            )}
            <Pressable
              onPress={() => { if (step < 4) { haptic.light(); setStep(step + 1); } else { handleSubmit(); } }}
              disabled={!canNext}
              style={[s.nextBtnWrap, !canNext && { opacity: 0.35 }]}
            >
              <LinearGradient
                colors={step === 4 ? ['#059669', '#047857'] : ['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.nextBtnGradient}
              >
                <Text style={s.nextBtnText}>
                  {step === 4 ? t('new_send') : t('new_continue')}
                </Text>
                {step === 4
                  ? <Send size={17} color="#fff" strokeWidth={2.5} />
                  : <ArrowRight size={17} color="#fff" strokeWidth={2.5} />
                }
              </LinearGradient>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  accentTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: 320,
  },
  accentBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '60%',
    height: 280,
  },
  decorLine: {
    position: 'absolute',
    top: 175,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: 'rgba(5,15,8,0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,185,129,0.15)',
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.3,
  },
});
