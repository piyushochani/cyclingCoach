// Browser requests use the Next.js /api rewrite proxy to avoid CORS issues in production.
const API_BASE =
  typeof window !== 'undefined'
    ? '/api'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300000;

export function clearApiCache() {
  cache.clear();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('cyclogenai_token');
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cyclogenai_token', token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('cyclogenai_token');
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  const isCacheable = method === 'GET';
  const token = getToken();
  const cacheKey = `${path}_${token || 'anon'}`;

  if (isCacheable) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const headers = { ...getAuthHeaders(), ...options?.headers };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cyclogenai_signed_in');
      localStorage.removeItem('cyclogenai_user');
      window.location.href = '/login';
    }
    throw new ApiError('Session expired', 401);
  }

  if (!res.ok) {
    let msg = `API error: ${res.statusText}`;
    try { const b = await res.json(); if (b.message) msg = b.message; } catch {}
    throw new ApiError(msg, res.status);
  }

  const data = await res.json();

  if (isCacheable) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  } else {
    clearApiCache();
  }

  return data;
}

export function dispatchDataRefetch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('data-refetch'));
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
