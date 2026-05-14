import { Activity } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';

import { Chip } from './Chip';
import { BODY_AREAS, DURATIONS } from './types';
import type { FormState } from './types';

interface Step3SymptomsProps {
  form: FormState;
  update: (p: Partial<FormState>) => void;
  t: (k: string) => string;
}

export function Step3Symptoms({ form, update, t }: Step3SymptomsProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400).springify()} style={s.header}>
        <View style={s.badge}>
          <Activity size={11} color="#34d399" strokeWidth={2.5} />
          <Text style={s.badgeText}>Étape 3 sur 4</Text>
        </View>
        <Text style={s.title}>{t('new_symptoms_title')}</Text>
        <Text style={s.subtitle}>{t('new_symptoms_desc')}</Text>
      </Animated.View>

      {/* ── Zone corporelle ── */}
      <Animated.View entering={FadeInDown.delay(60).duration(400).springify()} style={s.section}>
        <View style={s.sectionLabel}>
          <View style={s.sectionAccent} />
          <Text style={s.sectionText}>{t('new_body_area_label')}</Text>
        </View>
        <View style={s.chipRow}>
          {BODY_AREAS.map((a) => (
            <Chip
              key={a}
              active={form.body_area === a}
              onPress={() => { haptic.selection(); update({ body_area: a }); }}
            >
              {a}
            </Chip>
          ))}
        </View>
      </Animated.View>

      {/* ── Durée ── */}
      <Animated.View entering={FadeInDown.delay(120).duration(400).springify()} style={s.section}>
        <View style={s.sectionLabel}>
          <View style={s.sectionAccent} />
          <Text style={s.sectionText}>{t('new_duration_label')}</Text>
        </View>
        <View style={s.durationList}>
          {DURATIONS.map((d) => {
            const active = form.symptoms_duration === d;
            return (
              <Pressable
                key={d}
                onPress={() => { haptic.selection(); update({ symptoms_duration: d }); }}
                style={[s.durationCard, active && s.durationCardActive]}
              >
                <View style={[s.radio, active && s.radioActive]}>
                  {active && <View style={s.radioDot} />}
                </View>
                <Text style={[s.durationText, active && s.durationTextActive]}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ── Description ── */}
      <Animated.View entering={FadeInDown.delay(180).duration(400).springify()} style={s.section}>
        <View style={s.sectionLabel}>
          <View style={s.sectionAccent} />
          <Text style={s.sectionText}>{t('new_desc_label')}</Text>
        </View>
        <View style={[s.inputWrap, focused && s.inputWrapFocused]}>
          <TextInput
            value={form.symptoms}
            onChangeText={(v) => update({ symptoms: v })}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('new_desc_ph')}
            placeholderTextColor="#3f3f46"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={s.input}
          />
          <View style={s.charCount}>
            <Text style={[s.charCountText, form.symptoms.length >= 5 && s.charCountOk]}>
              {form.symptoms.length} car.
            </Text>
          </View>
        </View>
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

  section: { marginBottom: 20 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionAccent: { width: 3, height: 14, backgroundColor: '#10b981', borderRadius: 2 },
  sectionText: { color: '#a1a1aa', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  durationList: { gap: 8 },
  durationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)',
  },
  durationCardActive: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(52,211,153,0.35)',
    shadowColor: '#10b981', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3,
  },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  radioActive: { borderColor: '#10b981' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
  durationText: { flex: 1, color: '#71717a', fontSize: 14, fontWeight: '500' },
  durationTextActive: { color: '#6ee7b7', fontWeight: '600' },

  inputWrap: {
    borderRadius: 18, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputWrapFocused: {
    borderColor: 'rgba(52,211,153,0.45)',
    backgroundColor: 'rgba(16,185,129,0.05)',
    shadowColor: '#10b981', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 0 }, shadowRadius: 12, elevation: 4,
  },
  input: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 44,
    color: '#f4f4f5', fontSize: 15, lineHeight: 22,
    minHeight: 130,
  },
  charCount: { position: 'absolute', bottom: 12, right: 14 },
  charCountText: { color: '#3f3f46', fontSize: 11, fontWeight: '500' },
  charCountOk: { color: '#34d399' },
});
