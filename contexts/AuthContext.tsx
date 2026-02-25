"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setAccessToken } from "@/lib/api/client";
import {
  loginWithCredentials,
  registerWithCredentials,
  refreshAccessToken,
  fetchCurrentUser,
  logoutClient,
} from "@/lib/api/auth";
import { msUntilExpiry } from "@/lib/auth/token";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
  });

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Schedule a proactive token refresh 60 s before expiry. */
  const scheduleRefresh = useCallback((token: string) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    const ms = msUntilExpiry(token, 60);
    if (ms > 0) {
      refreshTimerRef.current = setTimeout(() => {
        refreshAccessToken().then((newToken) => {
          if (newToken) {
            setAccessToken(newToken);
            setState((s) => ({ ...s, accessToken: newToken }));
            scheduleRefresh(newToken);
          }
        });
      }, ms);
    }
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    const token = await refreshAccessToken();
    if (token) {
      setAccessToken(token);
      const user = await fetchCurrentUser();
      setState((s) => ({
        ...s,
        accessToken: token,
        user,
        isInitialized: true,
      }));
      scheduleRefresh(token);
    } else {
      setAccessToken(null);
      clearRefreshTimer();
      setState((s) => ({
        ...s,
        accessToken: null,
        user: null,
        isInitialized: true,
      }));
    }
  }, [scheduleRefresh, clearRefreshTimer]);

  // Bootstrap: try to restore the session from the httpOnly cookie on mount
  useEffect(() => {
    refresh();
    return () => clearRefreshTimer();
  }, [refresh, clearRefreshTimer]);

  // Listen for forced logout events (e.g. from axios 401 interceptor)
  useEffect(() => {
    const handler = () => {
      setAccessToken(null);
      clearRefreshTimer();
      setState((s) => ({ ...s, accessToken: null, user: null }));
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [clearRefreshTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const res = await loginWithCredentials({ email, password });
        setAccessToken(res.access);
        const user = res.user ?? (await fetchCurrentUser());
        setState({
          user,
          accessToken: res.access,
          isLoading: false,
          isInitialized: true,
        });
        scheduleRefresh(res.access);
      } catch (err) {
        setState((s) => ({ ...s, isLoading: false }));
        throw err;
      }
    },
    [scheduleRefresh]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const res = await registerWithCredentials({
          email,
          password,
          password_confirm: password,
          full_name: name,
        });
        setAccessToken(res.access);
        const user = res.user ?? (await fetchCurrentUser());
        setState({
          user,
          accessToken: res.access,
          isLoading: false,
          isInitialized: true,
        });
        scheduleRefresh(res.access);
      } catch (err) {
        setState((s) => ({ ...s, isLoading: false }));
        throw err;
      }
    },
    [scheduleRefresh]
  );

  const logout = useCallback(async () => {
    clearRefreshTimer();
    await logoutClient();
    setAccessToken(null);
    setState({
      user: null,
      accessToken: null,
      isLoading: false,
      isInitialized: true,
    });
  }, [clearRefreshTimer]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      refresh,
    }),
    [state, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
