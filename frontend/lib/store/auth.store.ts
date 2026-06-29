import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '../api/client';
import { authService, AuthUser, LoginPayload, UpdateProfilePayload } from '../api/auth.service';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<{ requiresTwoFactor: boolean; tempToken?: string }>;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,

      login: async (payload) => {
        set({ isLoading: true });
        try {
          const data = await authService.login(payload);
          if (data.requiresTwoFactor) {
            set({ isLoading: false });
            return { requiresTwoFactor: true, tempToken: data.tempToken };
          }
          setAuthToken(data.accessToken!);
          set({ token: data.accessToken, user: data.user, isLoading: false });
          return { requiresTwoFactor: false };
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: () => {
        setAuthToken(null);
        set({ token: null, user: null });
      },

      updateProfile: async (payload) => {
        set({ isLoading: true });
        try {
          const updated = await authService.updateProfile(payload);
          set((s) => ({ user: { ...s.user!, ...updated }, isLoading: false }));
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
      },
    },
  ),
);
