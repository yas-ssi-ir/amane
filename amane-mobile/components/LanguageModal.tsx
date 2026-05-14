import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { LANGUAGES, type Lang, useI18n, useT } from '@/lib/i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LanguageModal({ visible, onClose }: Props) {
  const { lang, setLang } = useI18n();
  const t = useT();

  const select = (code: Lang) => {
    haptic.light();
    setLang(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />

        <View style={{ backgroundColor: '#18181b', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ color: '#fafafa', fontWeight: '700', fontSize: 18 }}>{t('change_language')}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#71717a" />
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            {LANGUAGES.map((l) => {
              const active = lang === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => select(l.code)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16,
                    backgroundColor: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                    borderWidth: 1, borderColor: active ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{l.flag}</Text>
                  <Text style={{ flex: 1, fontWeight: '600', fontSize: 16, color: active ? '#6ee7b7' : '#e4e4e7' }}>
                    {l.label}
                  </Text>
                  {active && <Check size={18} color="#34d399" />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
