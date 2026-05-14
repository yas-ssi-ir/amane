import { ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import '../global.css';

import { useAuthStore } from '@/lib/auth-store';

// Theme dark navigation custom
const AmaneDarkTheme = {
  dark: true,
  colors: {
    primary: '#10b981',
    background: '#09090b',
    card: '#0a0a0b',
    text: '#fafafa',
    border: 'rgba(255,255,255,0.06)',
    notification: '#10b981',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={AmaneDarkTheme}>
        <View className="flex-1 bg-zinc-950">
          <AuthSync />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#09090b' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
            <Stack.Screen name="result/[id]" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
          <StatusBar style="light" />
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * AuthSync — verifie/refresh le user au demarrage et redirige vers /login
 * quand le token devient null (typiquement apres un 401 -> logout interceptor).
 *
 * Couvre le cas ou l'utilisateur est sur /result/[id] (hors tabs guard) et
 * que son token expire pendant l'utilisation.
 */
function AuthSync() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const router = useRouter();
  const segments = useSegments();
  const wasAuthenticated = useRef(false);

  // Au boot : revalide le token aupres du backend
  useEffect(() => {
    if (hydrated) refreshUser();
  }, [hydrated, refreshUser]);

  // Redirige vers /login si on perd le token alors qu'on etait connecte
  useEffect(() => {
    if (!hydrated) return;
    const isOnLogin = segments[0] === 'login';

    if (token) {
      wasAuthenticated.current = true;
    } else if (wasAuthenticated.current && !isOnLogin) {
      // On etait connecte, on ne l'est plus (401, logout, expiration) -> /login
      wasAuthenticated.current = false;
      router.replace('/login');
    }
  }, [token, hydrated, segments, router]);

  return null;
}
