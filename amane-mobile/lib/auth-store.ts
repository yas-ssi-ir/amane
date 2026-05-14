/**
 * Store zustand pour l'auth.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { authApi, setAuthHandlers } from './api';
import type { User } from './types';

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;

  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setHydrated: () => void;
}

const storage = {
  getItem: async (name: string) => {
    try {
      // WEB
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(name);
        }

        return null;
      }

      // MOBILE
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string) => {
    // WEB
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(name, value);
      }

      return;
    }

    // MOBILE
    await SecureStore.setItemAsync(name, value);
  },

  removeItem: async (name: string) => {
    // WEB
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(name);
      }

      return;
    }

    // MOBILE
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrated: false,

      login: async (username, password) => {
        const data = await authApi.login(username, password);

        set({
          token: data.token,
          user: data.user,
        });

        return data.user;
      },

      logout: () => {
        set({
          token: null,
          user: null,
        });
      },

      refreshUser: async () => {
        if (!get().token) return;

        try {
          const user = await authApi.me();

          set({ user });
        } catch {
          // ignore
        }
      },

      setHydrated: () => {
        set({ hydrated: true });
      },
    }),
    {
      name: 'amane-auth',
      storage: createJSONStorage(() => storage),

      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// Branche les handlers de api.ts (resout l'import circulaire)
setAuthHandlers({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => useAuthStore.getState().logout(),
});