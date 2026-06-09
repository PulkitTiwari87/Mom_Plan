import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, clearInMemoryToken, setInMemoryToken } from "../lib/api";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "counselor" | "user";
  plan: "free" | "family" | "navigator";
}

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isInitializing: boolean;
  authGeneration: number;
  setAuth: (user: AdminUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  updateUser: (user: Partial<AdminUser>) => void;
  setHydrated: () => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,
      isInitializing: true,
      authGeneration: 0,

      setAuth: (user, accessToken) => {
        setInMemoryToken(accessToken);
        set((state) => ({
          user,
          accessToken,
          isAuthenticated: true,
          authGeneration: state.authGeneration + 1,
        }));
      },

      setAccessToken: (accessToken) => {
        setInMemoryToken(accessToken);
        set({ accessToken });
      },

      logout: async () => {
        try {
          await api.post("/api/auth/logout");
        } catch {
          // Clear local session even if server logout fails
        } finally {
          clearInMemoryToken();
          set((state) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            authGeneration: state.authGeneration + 1,
          }));
        }
      },

      refreshSession: async () => {
        const generationAtStart = get().authGeneration;
        const { refreshAccessToken } = await import("../lib/api");
        const accessToken = await refreshAccessToken();

        if (generationAtStart !== get().authGeneration) {
          return get().isAuthenticated;
        }

        if (!accessToken) {
          if (get().accessToken) {
            return get().isAuthenticated;
          }
          if (get().isAuthenticated) {
            clearInMemoryToken();
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
            });
          }
          return false;
        }

        try {
          const profileResponse = await api.get("/api/user/profile");
          if (generationAtStart !== get().authGeneration) {
            return get().isAuthenticated;
          }
          set({
            user: profileResponse.data.data,
            accessToken,
            isAuthenticated: true,
          });
        } catch {
          if (generationAtStart !== get().authGeneration) {
            return get().isAuthenticated;
          }
          set({ accessToken, isAuthenticated: true });
        }

        return true;
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setHydrated: () => set({ isHydrated: true }),
      setInitializing: (value) => set({ isInitializing: value }),
    }),
    {
      name: "momplan-admin-auth",
      partialize: (state: AuthState) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state: AuthState | undefined) => {
        state?.setHydrated();
      },
    } as any
  )
);
