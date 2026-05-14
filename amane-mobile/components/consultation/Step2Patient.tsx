import * as Location from 'expo-location';
import { MapPin, User, Wifi } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';
import type { Gender } from '@/lib/types';

import { Chip } from './Chip';
import { AGE_RANGES, REGIONS } from './types';
import type { FormState, HealthCoverage, ZoneType } from './types';

interface Step2PatientProps {
  form: FormState;
  update: (p: Partial<FormState>) => void;
  t: (k: string) => string;
  GENDERS: { value: Gender; label: string }[];
}

const COVERAGE_OPTIONS: {
  value: HealthCoverage;
  label: string;
  sub: string;
  bg: string;
  border: string;
  text: string;
}[] = [
  { value: 'cnss',       label: 'CNSS',       sub: 'Salarié assuré',    bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd' },
  { value: 'mutuelle',   label: 'Mutuelle',   sub: 'Bonne couverture',  bg: 'rgba(16,185,129,0.12)', border: 'rgba(52,211,153,0.35)', text: '#6ee7b7' },
  { value: 'ramed',      label: 'RAMED',      sub: 'Faibles revenus',   bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d' },
  { value: 'non_assure', label: 'Non assuré', sub: 'Aucune couverture', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  text: '#fca5a5' },
];

const ZONE_OPTIONS: { value: ZoneType; label: string; emoji: string }[] = [
  { value: 'rural',      label: 'Rural',      emoji: '🌾' },
  { value: 'periurbain', label: 'Périurbain', emoji: '🏘️' },
  { value: 'urbain',     label: 'Urbain',     emoji: '🏙️' },
];

export function Step2Patient({ form, update, t, GENDERS }: Step2PatientProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const getGPS = async () => {
    haptic.medium();
    setGpsLoading(true);
    setGpsError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsError('Permission GPS refusée'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      update({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const subregion = (place?.subregion ?? place?.city ?? '').toLowerCase();
      const isRural = !place?.city || subregion.includes('rural') || subregion.includes('commune');
      update({ zone_type: isRural ? 'rural' : 'urbain' });
      haptic.success();
    } catch {
      setGpsError('Impossible de récupérer la position');
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400).springify()} style={s.header}>
        <View style={s.badge}>
          <User size={11} color="#34d399" strokeWidth={2.5} />
          <Text style={s.badgeText}>Étape 2 sur 4</Text>
        </View>
        <Text style={s.title}>{t('new_patient_title')}</Text>
        <Text style={s.subtitle}>{t('new_patient_desc')}</Text>
      </Animated.View>

      {/* ── Âge ── */}
      <Animated.View entering={FadeInDown.delay(60).duration(400).springify()} style={s.section}>
        <View style={s.sectionLabel}>
          <View style={s.sectionAccent} />
          <Text style={s.sectionText}>{t('new_age_label')}</Text>
        </View>
        <View style={s.chipRow}>
          {AGE_RANGES.map((a) => (
            <Chip key={a} active={form.age_range === a} onPress={() => { haptic.selection(); update({ age_range: a }); }}>
              {a} {t('new_years')}
            </Chip>
          ))}
        </View>
      </Animated.View>

      {/* ── Genre ── */}
      <Animated.View entering={FadeInDown.delay(120).duration(400).springify()} style={s.section}>
        <View style={s.sectionLabel}>
          <View style={s.sectionAccent} />
          <Text style={s.sectionText}>{t('new_gender_label')}</Text>
        </View>
        <View style={s.genderRow}>
          {GENDERS.map((g) => {
            const active = form.gender === g.value;
            return (
              <Pressable
                key={g.value}
                onPress={() => { haptic.selection(); update({ gender: g.value }); }}
                style={[s.genderCard, active && s.genderCardActive]}
              >
                <Text style={[s.genderText, active && s.genderTextActive]}>{g.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ── Couverture santé ── */}
      <Animated.View entering={FadeInDown.delay(180).duration(400).springify()} style={s.section}>
        <View style={s.sectionLabel}>
          <View style={s.sectionAccent} />
          <Text style={s.sectionText}>Couverture santé</Text>
        </View>
        <View style={s.coverageGrid}>
          {COVERAGE_OPTIONS.map((opt) => {
            const active = form.health_coverage === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => { haptic.selection(); update({ health_coverage: opt.value }); }}
                style={[
                  s.coverageCard,
                  active
                    ? { backgroundColor: opt.bg, borderColor: opt.border }
                    : s.coverageCardInactive,
                ]}
              >
                <Text style={[s.coverageLabel, active && { color: opt.text }]}>{opt.label}</Text>
                <Text style={[s.coverageSub, active && { color: opt.text, opacity: 0.75 }]}>{opt.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ── Zone géographique ── */}
      <Animated.View entering={FadeInDown.delay(240).duration(400).springify()} style={s.section}>
        <View style={s.zoneHeaderRow}>
          <View style={s.sectionLabel}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionText}>Zone géographique</Text>
          </View>
          <Pressable onPress={getGPS} disabled={gpsLoading} style={s.gpsBtn}>
            {gpsLoading
              ? <ActivityIndicator size="small" color="#34d399" />
              : <MapPin size={12} color="#34d399" strokeWidth={2.5} />
            }
            <Text style={s.gpsBtnText}>{form.latitude ? 'GPS ✓' : 'Détecter GPS'}</Text>
          </Pressable>
        </View>
        {gpsError && <Text style={s.gpsError}>{gpsError}</Text>}
        {form.latitude != null && (
          <View style={s.gpsCoords}>
            <Wifi size={11} color="#52525b" strokeWidth={2} />
            <Text style={s.gpsCoordsText}>
              {form.latitude.toFixed(4)}, {form.longitude?.toFixed(4)} — position détectée
            </Text>
          </View>
        )}
        <View style={s.zoneRow}>
          {ZONE_OPTIONS.map((opt) => {
            const active = form.zone_type === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => { haptic.selection(); update({ zone_type: opt.value }); }}
                style={[s.zoneCard, active && s.zoneCardActive]}
              >
                <Text style={s.zoneEmoji}>{opt.emoji}</Text>
                <Text style={[s.zoneLabel, active && s.zoneLabelActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ── Région ── */}
      <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} style={s.section}>
        <View style={s.sectionLabel}>
          <View style={s.sectionAccent} />
          <Text style={s.sectionText}>{t('new_region_label')}</Text>
        </View>
        <View style={s.chipRow}>
          {REGIONS.map((r) => (
            <Chip key={r} active={form.region === r} onPress={() => { haptic.selection(); update({ region: r }); }} small>
              {r}
            </Chip>
          ))}
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

  genderRow: { flexDirection: 'row', gap: 10 },
  genderCard: {
    flex: 1, height: 52, borderRadius: 16, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center', justifyContent: 'center',
  },
  genderCardActive: {
    backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(52,211,153,0.4)',
    shadowColor: '#10b981', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: 3,
  },
  genderText: { color: '#71717a', fontSize: 14, fontWeight: '600' },
  genderTextActive: { color: '#34d399' },

  coverageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  coverageCard: {
    width: '47%', borderRadius: 16, borderWidth: 1, padding: 14,
    flexGrow: 1,
  },
  coverageCardInactive: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)',
  },
  coverageLabel: { color: '#d4d4d8', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  coverageSub: { color: '#71717a', fontSize: 11 },

  zoneHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 12,
  },
  gpsBtnText: { color: '#34d399', fontSize: 11, fontWeight: '600' },
  gpsError: { color: '#f87171', fontSize: 12, marginBottom: 8 },
  gpsCoords: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  gpsCoordsText: { color: '#52525b', fontSize: 11 },

  zoneRow: { flexDirection: 'row', gap: 10 },
  zoneCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
  },
  zoneCardActive: {
    backgroundColor: 'rgba(139,92,246,0.12)', borderColor: 'rgba(167,139,250,0.4)',
    shadowColor: '#8b5cf6', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: 3,
  },
  zoneEmoji: { fontSize: 20, marginBottom: 5 },
  zoneLabel: { color: '#71717a', fontSize: 12, fontWeight: '600' },
  zoneLabelActive: { color: '#c4b5fd' },
});
