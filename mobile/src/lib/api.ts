import * as SecureStore from 'expo-secure-store';
import type { AdminUser } from '@/types';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export const NETWORK_ERROR = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';

const REFRESH_KEY = 'pouk.refreshToken';
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
  auth?: boolean;
}

// Access token hanya di memori; refresh token di SecureStore (Keychain/Keystore).
let accessToken: string | null = null;
let onSessionEnded: (() => void) | null = null;
let refreshing: Promise<AuthResponse | null> | null = null;

export const setSessionEndedHandler = (fn: () => void) => {
  onSessionEnded = fn;
};

export async function saveSession({ accessToken: access, refreshToken }: AuthResponse) {
  accessToken = access;
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearSession() {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);

async function raw<T>(path: string, { method = 'GET', body, form }: Options, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.message || `Terjadi kesalahan (${res.status})`, res.status, data?.error?.details);
  }
  return data as T;
}

// Mengembalikan null bila sesi sudah tidak berlaku. Kesalahan jaringan diteruskan agar sesi tidak terhapus saat offline.
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;
      const res = await raw<AuthResponse>('/api/auth/refresh', { method: 'POST', body: { refreshToken } });
      await saveSession(res);
      return res;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearSession();
        return null;
      }
      throw err;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  if (!options.auth) return raw<T>(path, options);
  if (!accessToken) await refreshSession();
  try {
    return await raw<T>(path, options, accessToken);
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 401)) throw err;
    const renewed = await refreshSession();
    if (!renewed) {
      onSessionEnded?.();
      throw err;
    }
    return raw<T>(path, options, accessToken);
  }
}

// URL dari server bisa relatif (/uploads/...) atau absolut.
export function imageUri(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith('/') ? API_URL + url : url;
}
