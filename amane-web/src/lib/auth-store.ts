/**
 * Auth store zustand avec persistance localStorage.
 * Sur web simple — pour mobile on aurait SecureStore (cf. amane-mobile).
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { authApi, setAuthHandlers } from "./api";
import type { User } from "./types";

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setHydrated: () => void;
}

const safeStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(name);
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
        set({ token: data.token, user: data.user });
        return data.user;
      },

      logout: () => {
        set({ token: null, user: null });
      },

      refreshUser: async () => {
        if (!get().token) return;
        try {
          const user = await authApi.me();
          set({ user });
        } catch {
          // 401 -> interceptor a deja vide le store
        }
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "amane-auth",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);

setAuthHandlers({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => useAuthStore.getState().logout(),
});
