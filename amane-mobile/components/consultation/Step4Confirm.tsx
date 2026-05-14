import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  Clock,
  Globe,
  Send,
  Sparkles,
  Stethoscope,
  User,
  Video,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { FormState } from './types';

function genderLabel(gender: FormState['gender'], t: (k: string) => string) {
  if (gender === 'M') return t('new_gender_m');
  if (gender === 'F') return t('new_gender_f');
  if (gender === 'AUTRE') return t('new_gender_other');
  return '—';
}

interface Step4ConfirmProps {
  form: FormState;
  t: (k: string) => string;
}

export function Step4Confirm({ form, t }: Step4ConfirmProps) {
  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400).springify()} style={s.header}>
        <View style={s.badge}>
          <Send size={11} color="#34d399" strokeWidth={2.5} />
          <Text style={s.badgeText}>Étape 4 sur 4</Text>
        </View>
        <Text style={s.title}>{t('new_confirm_title')}</Text>
        <Text style={s.subtitle}>{t('new_confirm_desc')}</Text>
      </Animated.View>

      {/* ── Photo ── */}
      {form.imageUri && (
        <Animated.View entering={FadeInDown.delay(60).duration(400).springify()} style={s.imageWrap}>
          <Image source={{ uri: form.imageUri }} style={s.image} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={s.imageGradient}
          />
          <View style={s.imageBadge}>
            <CheckCircle2 size={12} color="#09090b" strokeWidth={3} />
            <Text style={s.imageBadgeText}>Photo prête</Text>
          </View>
          {form.videoUri && (
            <View style={s.videoBadge}>
              <Video size={11} color="#fff" strokeWidth={2.5} />
              <Text style={s.videoBadgeText}>+ Vidéo</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── Résumé patient ── */}
      <Animated.View entering={FadeInDown.delay(120).duration(400).springify()} style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.cardAccent} />
          <Text style={s.cardTitle}>Informations patient</Text>
        </View>
        <View style={s.infoRow}>
          <View style={s.infoIcon}><User size={14} color="#34d399" strokeWidth={2} /></View>
          <Text style={s.infoLabel}>{t('new_age_recap')}</Text>
          <Text style={s.infoValue}>{form.age_range ? `${form.age_range} ans` : '—'}</Text>
        </View>
        <View style={[s.infoRow, s.infoRowDivider]}>
          <View style={s.infoIcon}><User size={14} color="#34d399" strokeWidth={2} /></View>
          <Text style={s.infoLabel}>{t('new_gender_recap')}</Text>
          <Text style={s.infoValue}>{genderLabel(form.gender, t)}</Text>
        </View>
        <View style={[s.infoRow, s.infoRowDivider]}>
          <View style={s.infoIcon}><Globe size={14} color="#34d399" strokeWidth={2} /></View>
          <Text style={s.infoLabel}>{t('new_region_recap')}</Text>
          <Text style={s.infoValue} numberOfLines={1}>{form.region}</Text>
        </View>
      </Animated.View>

      {/* ── Zone & Durée ── */}
      <Animated.View entering={FadeInDown.delay(180).duration(400).springify()} style={s.miniRow}>
        <View style={s.miniCard}>
          <View style={[s.miniIconBox, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
            <Stethoscope size={15} color="#a78bfa" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.miniLabel}>{t('new_area_recap')}</Text>
            <Text style={s.miniValue}>{form.body_area || '—'}</Text>
          </View>
        </View>
        <View style={s.miniCard}>
          <View style={[s.miniIconBox, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
            <Clock size={15} color="#34d399" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.miniLabel}>{t('new_duration_recap')}</Text>
            <Text style={s.miniValue} numberOfLines={2}>{form.symptoms_duration || '—'}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Symptômes ── */}
      {form.symptoms.length > 0 && (
        <Animated.View entering={FadeInDown.delay(240).duration(400).springify()} style={s.symptomsCard}>
          <View style={s.cardHeader}>
            <View style={[s.cardAccent, { backgroundColor: '#a78bfa' }]} />
            <Text style={s.cardTitle}>{t('new_symptoms_recap')}</Text>
          </View>
          <Text style={s.symptomsText}>{form.symptoms}</Text>
        </Animated.View>
      )}

      {/* ── Prêt à envoyer ── */}
      <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} style={s.readyRow}>
        <Sparkles size={14} color="#34d399" strokeWidth={2} />
        <Text style={s.readyText}>
          Tout est prêt — appuyez sur <Text style={s.readyBold}>Envoyer</Text>
        </Text>
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
    borderRadius: 24, overflow: 'hidden', marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
    shadowColor: '#10b981', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 6,
  },
  image: { width: '100%', aspectRatio: 4 / 3 },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  imageBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#10b981', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  imageBadgeText: { color: '#09090b', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  videoBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(59,130,246,0.85)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  videoBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardAccent: { width: 3, height: 14, backgroundColor: '#10b981', borderRadius: 2 },
  cardTitle: { color: '#a1a1aa', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  infoRowDivider: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  infoIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(52,211,153,0.1)', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: { flex: 1, color: '#71717a', fontSize: 13 },
  infoValue: { color: '#f4f4f5', fontSize: 13, fontWeight: '600', maxWidth: '52%', textAlign: 'right' },

  miniRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  miniCard: {
    flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 14,
  },
  miniIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  miniLabel: { color: '#71717a', fontSize: 11, marginBottom: 2 },
  miniValue: { color: '#f4f4f5', fontSize: 13, fontWeight: '600' },

  symptomsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, padding: 16, marginBottom: 12,
  },
  symptomsText: { color: '#d4d4d8', fontSize: 14, lineHeight: 22 },

  readyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(16,185,129,0.07)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 4,
  },
  readyText: { color: '#6ee7b7', fontSize: 13, flex: 1 },
  readyBold: { fontWeight: '700', color: '#34d399' },
});
