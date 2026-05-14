import { Redirect, Tabs } from 'expo-router';
import { Bot, Camera, HelpCircle, LayoutDashboard, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { HelpModal } from '@/components/HelpModal';
import { useAuthStore } from '@/lib/auth-store';
import { useT } from '@/lib/i18n';

export default function TabLayout() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const t = useT();
  const [helpVisible, setHelpVisible] = useState(false);

  if (!hydrated) return null;
  if (!token) return <Redirect href="/login" />;

  return (
    <>
      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#34d399',
          tabBarInactiveTintColor: '#71717a',
          headerShown: true,
          headerStyle: { backgroundColor: '#09090b', borderBottomWidth: 0, shadowColor: 'transparent', elevation: 0 },
          headerTitleStyle: { color: '#fafafa', fontWeight: '700', fontSize: 17, letterSpacing: -0.3 },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => setHelpVisible(true)}
              hitSlop={10}
              style={{ marginRight: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
            >
              <HelpCircle size={18} color="#a1a1aa" />
            </Pressable>
          ),
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 84 : 68,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 8,
            backgroundColor: '#09090b',
            borderTopColor: 'rgba(255,255,255,0.06)',
            borderTopWidth: 1,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tableau de bord',
            tabBarLabel: t('home'),
            tabBarIcon: ({ color, focused }) => (
              <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="new"
          options={{
            title: 'Nouvelle consultation',
            tabBarLabel: () => null,
            tabBarIcon: ({ focused }) => (
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: focused ? '#059669' : '#10b981',
                shadowColor: '#10b981', shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 4,
              }}>
                <Camera size={19} color="#09090b" strokeWidth={2.5} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Assistant AMANE',
            tabBarLabel: t('assistant'),
            tabBarIcon: ({ color, focused }) => (
              <Bot size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Mon profil',
            tabBarLabel: t('profile'),
            tabBarIcon: ({ color, focused }) => (
              <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
