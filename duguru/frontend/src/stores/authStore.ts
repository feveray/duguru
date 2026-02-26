import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  sunSign?: string | null;
  ascendant?: string | null;
  onboardingDone: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

/**
 * authStore — Estado de autenticação do duGuru (Zustand).
 *
 * • `user` é persistido no localStorage (sem tokens — Princípio III)
 * • Refresh token reside em cookie HttpOnly (backend)
 * • Access token é mantido em memória (gerenciado pelo axios interceptor)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "duguru-auth",
      partialize: (state) => ({
        // Persiste apenas os dados do usuário, NUNCA tokens
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
