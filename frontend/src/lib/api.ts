import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.__momplan_access_token__ ?? null;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<{ accessToken: string; user?: any } | null> | null = null;

function isAuthRefreshRequest(config?: InternalAxiosRequestConfig): boolean {
  const url = config?.url ?? "";
  return url.includes("/api/auth/refresh");
}

function isAuthLoginRequest(config?: InternalAxiosRequestConfig): boolean {
  const url = config?.url ?? "";
  return url.includes("/api/auth/login") || url.includes("/api/auth/register");
}

async function syncAccessToken(accessToken: string) {
  setInMemoryToken(accessToken);
  try {
    const { useAuthStore } = await import("@/store/auth.store");
    useAuthStore.getState().setAccessToken(accessToken);
  } catch {
    // Store unavailable during SSR
  }
}

export async function refreshAccessToken(): Promise<{ accessToken: string; user?: any } | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { accessToken, user } = response.data.data;
      await syncAccessToken(accessToken);
      return { accessToken, user };
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isAuthRefreshRequest(originalRequest) || isAuthLoginRequest(originalRequest)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
    return api(originalRequest);
  }
);

export function setInMemoryToken(token: string) {
  if (typeof window !== "undefined") {
    window.__momplan_access_token__ = token;
  }
}

export function clearInMemoryToken() {
  if (typeof window !== "undefined") {
    window.__momplan_access_token__ = undefined;
  }
}

declare global {
  interface Window {
    __momplan_access_token__?: string;
  }
}
