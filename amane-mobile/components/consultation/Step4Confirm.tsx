import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { RecapRow } from './RecapRow';
import type { FormState } from './types';

interface Step4ConfirmProps {
  form: FormState;
  t: (k: string) => string;
}

export function Step4Confirm({ form, t }: Step4ConfirmProps) {
  return (
    <View className="pt-3">
      <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">4 / 4</Text>
      <Text className="text-zinc-100 text-2xl font-bold tracking-tight">{t('new_confirm_title')}</Text>
      <Text className="text-zinc-400 text-sm mt-2 mb-6">{t('new_confirm_desc')}</Text>

      {form.imageUri && (
        <View className="rounded-3xl overflow-hidden bg-zinc-900 mb-4 border border-white/10">
          <Image
            source={{ uri: form.imageUri }}
            style={{ width: '100%', aspectRatio: 1 }}
            contentFit="cover"
          />
        </View>
      )}

      <View className="bg-white/[0.02] rounded-2xl border border-white/10 p-4 mb-4">
        <RecapRow label={t('new_age_recap')} value={form.age_range ? `${form.age_range} ${t('new_years')}` : '—'} />
        <RecapRow label={t('new_gender_recap')} value={
          form.gender === 'M' ? t('new_gender_m') :
          form.gender === 'F' ? t('new_gender_f') :
          form.gender === 'AUTRE' ? t('new_gender_other') : '—'
        } />
        <RecapRow label={t('new_region_recap')} value={form.region} />
        <RecapRow label={t('new_area_recap')} value={form.body_area || '—'} />
        <RecapRow label={t('new_duration_recap')} value={form.symptoms_duration || '—'} isLast />
      </View>

      {form.symptoms && (
        <View className="bg-white/[0.02] rounded-2xl border border-white/10 p-4">
          <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            {t('new_symptoms_recap')}
          </Text>
          <Text className="text-zinc-200 text-sm leading-relaxed">{form.symptoms}</Text>
        </View>
      )}
    </View>
  );
}
