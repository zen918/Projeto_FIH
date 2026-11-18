import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  getStoredToken,
  getStoredUser,
  setUnauthorizedHandler,
  storeToken,
  storeUser,
} from '../lib/api';
import type { HealthResponse, Profile, SessionResponse } from '../types';

interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  role: 'floricultura' | 'comercio_cliente' | 'pesquisador_lab';
  organizationName: string;
  city: string;
  phone: string;
}

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<Profile>;
  signup: (payload: SignupPayload) => Promise<SessionResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCurrentUser: (user: Profile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(() => getStoredUser<Profile>());
  const [loading, setLoading] = useState(Boolean(getStoredToken()));
  const [demoMode, setDemoMode] = useState(false);

  const clearSession = useCallback(() => {
    storeToken(null);
    storeUser(null);
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((next: Profile) => {
    setUser(next);
    storeUser(next);
  }, []);

  useEffect(() => {
    api
      .get<HealthResponse>('/health')
      .then((health) => setDemoMode(Boolean(health.demoMode)))
      .catch(() => setDemoMode(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<{ user: Profile }>('/auth/me')
      .then(({ user: profile }) => {
        if (cancelled) return;
        updateCurrentUser(profile);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession, updateCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await api.post<SessionResponse>('/auth/login', { email, password });
    if (!session.token) {
      throw new Error('Não foi possível iniciar a sessão.');
    }
    storeToken(session.token);
    storeUser(session.user);
    setUser(session.user);
    return session.user;
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const session = await api.post<SessionResponse>('/auth/signup', payload);
    if (session.token) {
      storeToken(session.token);
      storeUser(session.user);
      setUser(session.user);
    }
    return session;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Sessão local é descartada mesmo se a API estiver indisponível.
    }
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const { user: profile } = await api.get<{ user: Profile }>('/auth/me');
    updateCurrentUser(profile);
  }, [updateCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      demoMode,
      login,
      signup,
      logout,
      refreshUser,
      updateCurrentUser,
    }),
    [user, loading, demoMode, login, signup, logout, refreshUser, updateCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
