import * as Location from 'expo-location';
import { MapPin, Wifi } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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

const COVERAGE_OPTIONS: { value: HealthCoverage; label: string; sub: string }[] = [
  { value: 'cnss',       label: 'CNSS',        sub: 'Salarié assuré' },
  { value: 'mutuelle',   label: 'Mutuelle',     sub: 'Bonne couverture' },
  { value: 'ramed',      label: 'RAMED',        sub: 'Faibles revenus' },
  { value: 'non_assure', label: 'Non assuré',   sub: 'Aucune couverture' },
];

const ZONE_OPTIONS: { value: ZoneType; label: string; emoji: string }[] = [
  { value: 'rural',      label: 'Rural',      emoji: '🌾' },
  { value: 'periurbain', label: 'Périurbain', emoji: '🏘️' },
  { value: 'urbain',     label: 'Urbain',     emoji: '🏙️' },
];

const COVERAGE_COLORS: Record<HealthCoverage, { active: string; text: string }> = {
  cnss:       { active: 'bg-blue-500/15 border-blue-500/40',    text: 'text-blue-300' },
  mutuelle:   { active: 'bg-emerald-500/15 border-emerald-500/40', text: 'text-emerald-300' },
  ramed:      { active: 'bg-amber-500/15 border-amber-500/40',  text: 'text-amber-300' },
  non_assure: { active: 'bg-rose-500/15 border-rose-500/40',    text: 'text-rose-300' },
};

export function Step2Patient({ form, update, t, GENDERS }: Step2PatientProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const getGPS = async () => {
    haptic.medium();
    setGpsLoading(true);
    setGpsError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Permission GPS refusée');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      update({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      // Reverse geocoding pour détecter la région automatiquement
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Détecter zone type selon la sous-région
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
    <View className="pt-3">
      <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">2 / 4</Text>
      <Text className="text-zinc-100 text-2xl font-bold tracking-tight">{t('new_patient_title')}</Text>
      <Text className="text-zinc-400 text-sm mt-2 mb-6">{t('new_patient_desc')}</Text>

      {/* Âge */}
      <Text className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-2">
        {t('new_age_label')}
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {AGE_RANGES.map((a) => (
          <Chip key={a} active={form.age_range === a} onPress={() => { haptic.selection(); update({ age_range: a }); }}>
            {a} {t('new_years')}
          </Chip>
        ))}
      </View>

      {/* Genre */}
      <Text className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-2">
        {t('new_gender_label')}
      </Text>
      <View className="flex-row gap-2 mb-6">
        {GENDERS.map((g) => (
          <Pressable
            key={g.value}
            onPress={() => { haptic.selection(); update({ gender: g.value }); }}
            className={`flex-1 rounded-2xl py-3.5 border ${
              form.gender === g.value ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-white/[0.04] border-white/10'
            } active:bg-white/[0.06]`}
          >
            <Text className={`text-center text-sm font-semibold ${form.gender === g.value ? 'text-emerald-300' : 'text-zinc-200'}`}>
              {g.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Couverture santé */}
      <Text className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-2">
        Couverture santé
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {COVERAGE_OPTIONS.map((opt) => {
          const active = form.health_coverage === opt.value;
          const colors = COVERAGE_COLORS[opt.value];
          return (
            <Pressable
              key={opt.value}
              onPress={() => { haptic.selection(); update({ health_coverage: opt.value }); }}
              className={`rounded-2xl px-4 py-3 border flex-1 min-w-[40%] ${
                active ? colors.active : 'bg-white/[0.04] border-white/10'
              }`}
            >
              <Text className={`text-sm font-semibold ${active ? colors.text : 'text-zinc-300'}`}>
                {opt.label}
              </Text>
              <Text className={`text-[11px] mt-0.5 ${active ? colors.text : 'text-zinc-500'}`}>
                {opt.sub}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Zone + GPS */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-zinc-300 font-semibold text-xs uppercase tracking-widest">
          Zone géographique
        </Text>
        <Pressable
          onPress={getGPS}
          disabled={gpsLoading}
          className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5"
        >
          {gpsLoading
            ? <ActivityIndicator size="small" color="#34d399" />
            : <MapPin size={12} color="#34d399" />
          }
          <Text className="text-emerald-300 text-[11px] font-semibold">
            {form.latitude ? 'GPS ✓' : 'Détecter via GPS'}
          </Text>
        </Pressable>
      </View>

      {gpsError && (
        <Text className="text-rose-400 text-xs mb-2">{gpsError}</Text>
      )}
      {form.latitude && (
        <View className="flex-row items-center gap-1.5 mb-3">
          <Wifi size={11} color="#71717a" />
          <Text className="text-zinc-500 text-[11px]">
            {form.latitude.toFixed(4)}, {form.longitude?.toFixed(4)} — zone détectée automatiquement
          </Text>
        </View>
      )}

      <View className="flex-row gap-2 mb-6">
        {ZONE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => { haptic.selection(); update({ zone_type: opt.value }); }}
            className={`flex-1 rounded-2xl py-3 border items-center ${
              form.zone_type === opt.value
                ? 'bg-violet-500/15 border-violet-500/40'
                : 'bg-white/[0.04] border-white/10'
            }`}
          >
            <Text className="text-base mb-0.5">{opt.emoji}</Text>
            <Text className={`text-xs font-semibold ${form.zone_type === opt.value ? 'text-violet-300' : 'text-zinc-400'}`}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Région */}
      <Text className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-2">
        {t('new_region_label')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {REGIONS.map((r) => (
          <Chip key={r} active={form.region === r} onPress={() => { haptic.selection(); update({ region: r }); }} small>
            {r}
          </Chip>
        ))}
      </View>
    </View>
  );
}
