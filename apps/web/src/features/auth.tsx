import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

type User = { id?: string; username: string; full_name?: string };
type AuthContextValue = { user: User | null; loading: boolean; refresh: () => Promise<void>; login: (password: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try { setUser(await api<User>('/api/auth/me')); } catch { setUser(null); }
  };
  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user, loading, refresh,
    login: async (password) => { await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password }) }); await refresh(); },
    logout: async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => null); setUser(null); },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
