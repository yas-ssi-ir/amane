import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Video,
  X,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { CameraOverlayGuide } from './CameraOverlayGuide';
import type { FormState } from './types';

interface Step1ImageProps {
  form: FormState;
  t: (k: string) => string;
  onCamera: () => void;
  onGallery: () => void;
  onClear: () => void;
  onRecordVideo: () => void;
  onPickVideo: () => void;
  onClearVideo: () => void;
}

export function Step1Image({
  form, t, onCamera, onGallery, onClear, onRecordVideo, onPickVideo, onClearVideo,
}: Step1ImageProps) {
  return (
    <View className="pt-3">
      <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
        1 / 4
      </Text>
      <Text className="text-zinc-100 text-2xl font-bold tracking-tight">
        {t('new_photo_title')}
      </Text>
      <Text className="text-zinc-400 text-sm mt-2 mb-6">
        {t('new_photo_desc')}
      </Text>

      {form.imageUri ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="rounded-3xl overflow-hidden bg-zinc-900 mb-4 border border-emerald-500/30"
          style={{
            shadowColor: '#10b981',
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Image
            source={{ uri: form.imageUri }}
            style={{ width: '100%', aspectRatio: 1 }}
            contentFit="cover"
          />
          <View className="absolute top-3 left-3 bg-emerald-500 px-2.5 py-1 rounded-full flex-row items-center gap-1">
            <CheckCircle2 size={12} color="#09090b" strokeWidth={2.5} />
            <Text className="text-zinc-950 text-[10px] font-bold uppercase tracking-wide">
              Capturée
            </Text>
          </View>
          <Pressable
            onPress={onClear}
            className="absolute top-3 right-3 bg-black/60 rounded-full p-2.5"
            hitSlop={10}
          >
            <X size={18} color="white" />
          </Pressable>
        </Animated.View>
      ) : (
        <CameraOverlayGuide />
      )}

      <View className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl p-4 mb-4 flex-row gap-3">
        <Sparkles size={18} color="#34d399" strokeWidth={2} />
        <View className="flex-1">
          <Text className="text-emerald-300 font-semibold text-sm mb-1">{t('new_tip_title')}</Text>
          <Text className="text-emerald-200/80 text-xs leading-relaxed">{t('new_tip_body')}</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-5">
        <Pressable onPress={onCamera} className="flex-1 rounded-2xl overflow-hidden active:opacity-80">
          <LinearGradient
            colors={['#10b981', '#059669']}
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
            <Camera size={18} color="#09090b" strokeWidth={2.5} />
            <Text className="text-zinc-950 font-bold text-sm">{t('new_camera')}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={onGallery}
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl py-4 flex-row items-center justify-center gap-2 active:bg-white/[0.06]"
        >
          <ImageIcon size={18} color="#d4d4d8" strokeWidth={2.5} />
          <Text className="text-zinc-200 font-semibold text-sm">{t('new_gallery')}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <Text style={{ color: '#52525b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
          Vidéo patient (optionnel)
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </View>

      {form.videoUri ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(59,130,246,0.3)',
            borderRadius: 18,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={22} color="#93c5fd" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#bfdbfe', fontWeight: '600', fontSize: 13 }}>Vidéo attachée</Text>
            <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
              {form.videoName ?? 'video.mp4'}
            </Text>
            <Text style={{ color: '#4b7bb5', fontSize: 10, marginTop: 1 }}>
              Max 60 s · 480p · Le médecin la verra
            </Text>
          </View>
          <Pressable onPress={onClearVideo} hitSlop={10} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 8 }}>
            <X size={16} color="#71717a" />
          </Pressable>
        </Animated.View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={onRecordVideo}
            style={{
              flex: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
              backgroundColor: 'rgba(59,130,246,0.08)',
              paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Video size={16} color="#93c5fd" strokeWidth={2.5} />
            <Text style={{ color: '#93c5fd', fontWeight: '600', fontSize: 13 }}>Enregistrer</Text>
          </Pressable>
          <Pressable
            onPress={onPickVideo}
            style={{
              flex: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <ImageIcon size={16} color="#a1a1aa" strokeWidth={2.5} />
            <Text style={{ color: '#a1a1aa', fontWeight: '600', fontSize: 13 }}>Galerie</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
