import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminUser, Permission } from '@/types';
import {
  api,
  clearSession,
  getRefreshToken,
  refreshSession,
  saveSession,
  setSessionEndedHandler,
  type AuthResponse,
} from './api';

type Status = 'loading' | 'guest' | 'authed';

interface AuthContextValue {
  status: Status;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const signedOut = useCallback(() => {
    setUser(null);
    setStatus('guest');
    queryClient.removeQueries({ queryKey: ['admin'] });
  }, [queryClient]);

  // Memulihkan sesi pengelola di latar belakang; halaman publik tidak menunggu ini.
  useEffect(() => {
    setSessionEndedHandler(signedOut);
    refreshSession()
      .then((res) => {
        setUser(res?.user ?? null);
        setStatus(res ? 'authed' : 'guest');
      })
      .catch(() => setStatus('guest')); // offline: token tetap disimpan, dicoba lagi saat membuka area pengelola
  }, [signedOut]);

  const value = useMemo<AuthContextValue>(() => {
    const accept = async (res: AuthResponse) => {
      await saveSession(res);
      setUser(res.user);
      setStatus('authed');
      return res.user;
    };
    return {
      status,
      user,
      login: async (email, password) =>
        accept(await api<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } })),
      logout: async () => {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          await api('/api/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
        }
        await clearSession();
        signedOut();
      },
      changePassword: async (currentPassword, newPassword) => {
        await accept(
          await api<AuthResponse>('/api/auth/change-password', {
            method: 'POST',
            body: { currentPassword, newPassword },
            auth: true,
          }),
        );
      },
      can: (permission) => !!user?.permissions?.includes(permission),
    };
  }, [status, user, signedOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
