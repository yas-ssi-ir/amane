import { Bot, Camera, CheckCircle2, HelpCircle, Send, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function HelpModal({ visible, onClose }: Props) {
  const t = useT();

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
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={18} color="#34d399" />
              </View>
              <Text style={{ color: '#fafafa', fontWeight: '700', fontSize: 18 }}>{t('help_title')}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#71717a" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <HelpStep icon={<Camera size={18} color="#34d399" />} title={t('help_step1_title')} desc={t('help_step1_desc')} />
            <HelpStep icon={<Send size={18} color="#3b82f6" />} title={t('help_step2_title')} desc={t('help_step2_desc')} />
            <HelpStep icon={<Send size={18} color="#f59e0b" />} title={t('help_step3_title')} desc={t('help_step3_desc')} />
            <HelpStep icon={<CheckCircle2 size={18} color="#10b981" />} title={t('help_step4_title')} desc={t('help_step4_desc')} isLast />

            <View style={{ marginTop: 16, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12 }}>
              <Bot size={20} color="#34d399" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#a7f3d0', fontWeight: '600', fontSize: 14, marginBottom: 4 }}>{t('help_assistant_title')}</Text>
                <Text style={{ color: 'rgba(167,243,208,0.7)', fontSize: 12, lineHeight: 16 }}>{t('help_assistant_desc')}</Text>
              </View>
            </View>
          </ScrollView>

          <Pressable onPress={onClose} style={{ marginTop: 20, backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#09090b', fontWeight: '700', fontSize: 16 }}>{t('close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function HelpStep({ icon, title, desc, isLast = false }: { icon: React.ReactNode; title: string; desc: string; isLast?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: isLast ? 0 : 16 }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fafafa', fontWeight: '600', fontSize: 14, marginBottom: 2 }}>{title}</Text>
        <Text style={{ color: '#a1a1aa', fontSize: 12, lineHeight: 16 }}>{desc}</Text>
      </View>
    </View>
  );
}
