import { Pressable, Text, TextInput, View } from 'react-native';

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
  return (
    <View className="pt-3">
      <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">3 / 4</Text>
      <Text className="text-zinc-100 text-2xl font-bold tracking-tight">{t('new_symptoms_title')}</Text>
      <Text className="text-zinc-400 text-sm mt-2 mb-6">{t('new_symptoms_desc')}</Text>

      <Text className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-2">
        {t('new_body_area_label')}
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {BODY_AREAS.map((a) => (
          <Chip
            key={a}
            active={form.body_area === a}
            onPress={() => {
              haptic.selection();
              update({ body_area: a });
            }}
          >
            {a}
          </Chip>
        ))}
      </View>

      <Text className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-2">
        {t('new_duration_label')}
      </Text>
      <View className="gap-2 mb-6">
        {DURATIONS.map((d) => (
          <Pressable
            key={d}
            onPress={() => {
              haptic.selection();
              update({ symptoms_duration: d });
            }}
            className={`rounded-2xl py-3.5 px-4 border ${
              form.symptoms_duration === d
                ? 'bg-emerald-500/15 border-emerald-500/40'
                : 'bg-white/[0.04] border-white/10'
            } active:bg-white/[0.06]`}
          >
            <Text
              className={`text-sm font-semibold ${
                form.symptoms_duration === d ? 'text-emerald-300' : 'text-zinc-200'
              }`}
            >
              {d}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-2">
        {t('new_desc_label')}
      </Text>
      <TextInput
        value={form.symptoms}
        onChangeText={(v) => update({ symptoms: v })}
        placeholder={t('new_desc_ph')}
        placeholderTextColor="#52525b"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-base text-zinc-100 min-h-[100px]"
      />
    </View>
  );
}
