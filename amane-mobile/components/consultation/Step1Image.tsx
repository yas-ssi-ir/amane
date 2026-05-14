import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Video,
  X,
  Zap,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

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

export function Step1Image({ form, t, onCamera, onGallery, onClear, onRecordVideo, onPickVideo, onClearVideo }: Step1ImageProps) {
  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400).springify()} style={s.header}>
        <View style={s.badge}>
          <Camera size={11} color="#34d399" strokeWidth={2.5} />
          <Text style={s.badgeText}>Étape 1 sur 4</Text>
        </View>
        <Text style={s.title}>{t('new_photo_title')}</Text>
        <Text style={s.subtitle}>{t('new_photo_desc')}</Text>
      </Animated.View>

      {/* ── Zone image ── */}
      <Animated.View entering={FadeInDown.delay(80).duration(400).springify()}>
        {form.imageUri ? (
          <Animated.View entering={FadeIn.duration(300)} style={s.imageWrap}>
            <Image source={{ uri: form.imageUri }} style={s.image} contentFit="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={s.imageOverlay}
            />
            <View style={s.imageBadge}>
              <CheckCircle2 size={12} color="#09090b" strokeWidth={3} />
              <Text style={s.imageBadgeText}>Photo capturée</Text>
            </View>
            <Pressable onPress={onClear} style={s.clearBtn} hitSlop={12}>
              <X size={16} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </Animated.View>
        ) : (
          <CameraOverlayGuide />
        )}
      </Animated.View>

      {/* ── Tip ── */}
      <Animated.View entering={FadeInDown.delay(160).duration(400).springify()} style={s.tip}>
        <View style={s.tipIcon}>
          <Sparkles size={16} color="#34d399" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.tipTitle}>{t('new_tip_title')}</Text>
          <Text style={s.tipBody}>{t('new_tip_body')}</Text>
        </View>
      </Animated.View>

      {/* ── Boutons photo ── */}
      <Animated.View entering={FadeInDown.delay(220).duration(400).springify()} style={s.btnRow}>
        <Pressable onPress={onCamera} style={s.primaryBtnWrap}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.primaryBtn}
          >
            <Camera size={18} color="#fff" strokeWidth={2.5} />
            <Text style={s.primaryBtnText}>{t('new_camera')}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={onGallery} style={s.secondaryBtn}>
          <ImageIcon size={18} color="#a1a1aa" strokeWidth={2} />
          <Text style={s.secondaryBtnText}>{t('new_gallery')}</Text>
        </Pressable>
      </Animated.View>

      {/* ── Séparateur vidéo ── */}
      <Animated.View entering={FadeInDown.delay(280).duration(400).springify()} style={s.divider}>
        <View style={s.dividerLine} />
        <View style={s.dividerChip}>
          <Zap size={10} color="#52525b" strokeWidth={2} />
          <Text style={s.dividerText}>Vidéo (optionnel)</Text>
        </View>
        <View style={s.dividerLine} />
      </Animated.View>

      {/* ── Vidéo ── */}
      <Animated.View entering={FadeInDown.delay(320).duration(400).springify()}>
        {form.videoUri ? (
          <View style={s.videoCard}>
            <View style={s.videoIcon}>
              <Video size={20} color="#93c5fd" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.videoName}>Vidéo attachée</Text>
              <Text style={s.videoMeta} numberOfLines={1}>{form.videoName ?? 'video.mp4'}</Text>
            </View>
            <Pressable onPress={onClearVideo} hitSlop={10} style={s.videoRemove}>
              <X size={14} color="#71717a" strokeWidth={2.5} />
            </Pressable>
          </View>
        ) : (
          <View style={s.videoBtnRow}>
            <Pressable onPress={onRecordVideo} style={s.videoBtnRecord}>
              <Video size={15} color="#93c5fd" strokeWidth={2.5} />
              <Text style={s.videoBtnRecordText}>Enregistrer</Text>
            </Pressable>
            <Pressable onPress={onPickVideo} style={s.videoBtnGallery}>
              <ImageIcon size={15} color="#71717a" strokeWidth={2} />
              <Text style={s.videoBtnGalleryText}>Galerie</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { paddingTop: 4 },
  header: { marginBottom: 20 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12,
  },
  badgeText: { color: '#34d399', fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: '#f4f4f5', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { color: '#71717a', fontSize: 14, lineHeight: 20 },

  imageWrap: {
    borderRadius: 24, overflow: 'hidden',
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
    shadowColor: '#10b981', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 6,
  },
  image: { width: '100%', aspectRatio: 1 },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  imageBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#10b981', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  imageBadgeText: { color: '#09090b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  clearBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },

  tip: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.07)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.18)',
    borderRadius: 18, padding: 14, marginBottom: 16,
  },
  tipIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(52,211,153,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  tipTitle: { color: '#6ee7b7', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  tipBody: { color: 'rgba(110,231,183,0.7)', fontSize: 12, lineHeight: 18 },

  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  primaryBtnWrap: {
    flex: 1, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#10b981', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 5,
  },
  primaryBtn: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flex: 1, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  secondaryBtnText: { color: '#a1a1aa', fontWeight: '600', fontSize: 15 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dividerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  dividerText: { color: '#52525b', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  videoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(59,130,246,0.07)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 18, padding: 14,
  },
  videoIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  videoName: { color: '#bfdbfe', fontWeight: '600', fontSize: 13 },
  videoMeta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  videoRemove: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 8,
  },
  videoBtnRow: { flexDirection: 'row', gap: 10 },
  videoBtnRecord: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.07)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  videoBtnRecordText: { color: '#93c5fd', fontWeight: '600', fontSize: 13 },
  videoBtnGallery: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  videoBtnGalleryText: { color: '#71717a', fontWeight: '600', fontSize: 13 },
});
