import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  Globe,
  Hash,
  LogOut,
  ShieldX,
  User as UserIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageModal } from '@/components/LanguageModal';
import { useAuthStore } from '@/lib/auth-store';
import { haptic } from '@/lib/haptics';
import { LANGUAGES, useI18n, useT } from '@/lib/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { lang } = useI18n();
  const t = useT();
  const [langVisible, setLangVisible] = useState(false);

  const handleLogout = () => {
    haptic.warning();
    logout();
    router.replace('/login');
  };

  const initial = user?.full_name?.charAt(0).toUpperCase() ?? '?';
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['bottom']}>
      <LanguageModal visible={langVisible} onClose={() => setLangVisible(false)} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero gradient avec avatar */}
        <Animated.View entering={FadeInDown.duration(500).springify()} className="px-5 pt-4">
          <View className="rounded-3xl overflow-hidden border border-white/10">
            <LinearGradient
              colors={['#064e3b', '#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 28, alignItems: 'center' }}
            >
              <View
                className="w-24 h-24 rounded-3xl bg-white items-center justify-center mb-3"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 6 },
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Text className="text-emerald-600 text-4xl font-bold">{initial}</Text>
              </View>
              <Text className="text-white text-xl font-bold">{user?.full_name}</Text>
              <View className="bg-white/20 px-3 py-1 rounded-full mt-2 flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                  {user?.role}
                </Text>
              </View>
              {/* Badge de vérification pour infirmier/médecin */}
              {(user?.role === 'infirmier' || user?.role === 'medecin') && (
                <View style={{ marginTop: 10 }}>
                  {user?.verification_status === 'approved' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)' }}>
                      <BadgeCheck size={14} color="#34d399" strokeWidth={2.5} />
                      <Text style={{ color: '#34d399', fontSize: 12, fontWeight: '600' }}>Identité vérifiée</Text>
                    </View>
                  )}
                  {user?.verification_status === 'pending' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(251,191,36,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)' }}>
                      <Clock size={14} color="#fbbf24" strokeWidth={2.5} />
                      <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: '600' }}>En attente de vérification</Text>
                    </View>
                  )}
                  {user?.verification_status === 'rejected' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' }}>
                      <ShieldX size={14} color="#f87171" strokeWidth={2.5} />
                      <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '600' }}>Compte refusé — contacter admin</Text>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Compte */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Section title={t('account')}>
            <InfoRow
              icon={<UserIcon size={18} color="#a1a1aa" />}
              label={t('identifier')}
              value={user?.username ?? '—'}
            />
            <InfoRow
              icon={<Globe size={18} color="#a1a1aa" />}
              label={t('region')}
              value={user?.region ?? '—'}
            />
            <InfoRow
              icon={<Hash size={18} color="#a1a1aa" />}
              label={t('user_id')}
              value={user?.id ? `${user.id.slice(0, 8)}...` : '—'}
              isLast
            />
          </Section>
        </Animated.View>

        {/* Langue */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Section title={t('language')}>
            <Pressable
              onPress={() => setLangVisible(true)}
              className="flex-row items-center px-4 py-3.5 active:bg-white/[0.03]"
            >
              <View className="w-9 h-9 rounded-xl bg-white/[0.04] items-center justify-center mr-3">
                <Globe size={18} color="#a1a1aa" />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-500 text-xs">{t('language')}</Text>
                <Text className="text-zinc-100 font-medium text-sm mt-0.5">
                  {currentLang?.flag} {currentLang?.label}
                </Text>
              </View>
              <ChevronRight size={16} color="#52525b" />
            </Pressable>
          </Section>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mt-6">
          <Pressable
            onPress={handleLogout}
            className="bg-rose-500/10 border border-rose-500/30 rounded-2xl py-4 flex-row items-center justify-center gap-2 active:bg-rose-500/15"
          >
            <LogOut size={18} color="#fb7185" strokeWidth={2.2} />
            <Text className="text-rose-300 font-semibold text-base">{t('logout')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="px-5 mt-6">
      <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">
        {title}
      </Text>
      <View className="bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function InfoRow({
  icon, label, value, isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row items-center px-4 py-3.5 ${!isLast ? 'border-b border-white/[0.06]' : ''}`}>
      <View className="w-9 h-9 rounded-xl bg-white/[0.04] items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-zinc-500 text-xs">{label}</Text>
        <Text className="text-zinc-100 font-medium text-sm mt-0.5">{value}</Text>
      </View>
    </View>
  );
}
