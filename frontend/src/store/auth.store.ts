import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  api,
  refreshAccessToken,
  revokeSession,
  setInMemoryToken,
} from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin" | "counselor";
  plan: "community" | "partner" | "network";
  phone?: string;
  state?: string;
  zip_code?: string;
  profile_picture?: string;
  family_profile?: {
    household_size: number;
    num_children: number;
    monthly_income: number;
    employment_status: string;
    housing_status: string;
    has_disability: boolean;
    is_pregnant: boolean;
    children_ages?: number[];

    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    children_dobs?: string[];
    ssn_last_four?: string | null;
    date_of_birth?: string | null;
    preferred_language?: string;
    monthly_rent?: number;
    eviction_risk?: boolean;
    needs_childcare?: boolean;
    monthly_childcare_cost?: number | null;
    health_insurance?: string;
    chronic_illness?: boolean;
    immigration_status?: string;
    domestic_violence?: boolean;
    marital_status?: string;
    other_adults?: boolean;
    income_sources?: string[];
    savings_assets?: string;
    legal_issues?: string[];
    urgency?: string;

    employer_name?: string | null;
    other_household_income?: number | boolean | null;
    work_situation?: string | null;

    child_support_status?: string | null;
    monthly_utilities?: number | null;
    landlord_name?: string | null;

    childcare_preference?: string | null;
    childcare_provider?: string | null;
  };
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isInitializing: boolean;
  authGeneration: number;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  ensureSession: () => Promise<boolean>;
  updateUser: (user: Partial<AuthUser>) => void;
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

      login: async (email, password) => {
        const response = await api.post("/api/auth/login", { email, password });
        const { user, accessToken } = response.data.data;
        get().setAuth(user, accessToken);
        return user;
      },

      logout: async () => {
        await revokeSession();
      },

      refreshSession: async () => {
        const generationAtStart = get().authGeneration;

        try {
          const result = await refreshAccessToken();

          // Login/logout happened while refresh was in flight — don't apply stale result
          if (generationAtStart !== get().authGeneration) {
            return get().isAuthenticated;
          }

          if (!result) {
            if (get().accessToken) {
              return get().isAuthenticated;
            }
            await revokeSession();
            return false;
          }

          const { accessToken, user } = result;
          setInMemoryToken(accessToken);

          try {
            const profileResponse = await api.get("/api/user/profile");
            if (generationAtStart !== get().authGeneration) {
              return get().isAuthenticated;
            }
            const profile = profileResponse.data?.data ?? user;
            set({
              user: profile,
              accessToken,
              isAuthenticated: true,
            });
          } catch {
            if (generationAtStart !== get().authGeneration) {
              return get().isAuthenticated;
            }
            set({
              user,
              accessToken,
              isAuthenticated: true,
            });
          }

          return true;
        } catch {
          if (generationAtStart !== get().authGeneration) {
            return get().isAuthenticated;
          }
          if (get().accessToken) {
            return get().isAuthenticated;
          }
          return get().isAuthenticated;
        }
      },

      ensureSession: async () => {
        const state = get();
        if (state.accessToken && typeof window !== "undefined" && window.__momplan_access_token__) {
          return true;
        }
        return get().refreshSession();
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setHydrated: () => set({ isHydrated: true }),
      setInitializing: (value) => set({ isInitializing: value }),
    }),
    {
      name: "momplan-user",
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
