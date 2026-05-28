const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getUserHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('cycloai_user');
    if (!raw) return {};
    const user = JSON.parse(raw);
    const id = user._id || user.id;
    return id ? { 'X-User-Id': id } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...getUserHeaders(), ...options?.headers };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    let msg = `API error: ${res.statusText}`;
    try { const b = await res.json(); if (b.message) msg = b.message; } catch {}
    throw new ApiError(msg, res.status);
  }
  return res.json();
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
