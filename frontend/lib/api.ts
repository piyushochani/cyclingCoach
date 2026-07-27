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

export interface JobStatusResponse {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | string;
  result?: unknown;
  failedReason?: string | null;
}

export interface AgentStreamEvent {
  type: 'status' | 'token' | 'done' | 'error';
  data: Record<string, unknown>;
}

/** Stream agent chat via SSE (POST /agent/chat/stream). */
export async function streamAgentChat(
  message: string,
  chatId: string | undefined,
  onEvent: (event: AgentStreamEvent) => void,
): Promise<string> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_BASE}/agent/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, chatId }),
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

  clearApiCache();

  const reader = res.body?.getReader();
  if (!reader) throw new ApiError('No response stream', 500);

  const decoder = new TextDecoder();
  let buffer = '';
  let finalText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      if (!part.trim()) continue;
      let eventType = 'message';
      let dataStr = '';
      for (const line of part.split('\n')) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim();
        else if (line.startsWith('data: ')) dataStr = line.slice(6);
      }
      if (!dataStr) continue;
      try {
        const data = JSON.parse(dataStr);
        onEvent({ type: eventType as AgentStreamEvent['type'], data });
        if (eventType === 'done' && typeof data.text === 'string') {
          finalText = data.text;
        }
      } catch {
        // skip malformed events
      }
    }
  }

  return finalText;
}

/** Poll GET /jobs/:id until the background job completes or fails. */
export async function pollJobUntilComplete(
  jobId: string,
  options?: { intervalMs?: number; timeoutMs?: number },
): Promise<JobStatusResponse> {
  const intervalMs = options?.intervalMs ?? 1500;
  const timeoutMs = options?.timeoutMs ?? 120000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const job = await request<JobStatusResponse>(`/jobs/${encodeURIComponent(jobId)}`);
    if (job.status === 'completed') return job;
    if (job.status === 'failed') {
      throw new ApiError(job.failedReason || 'Background job failed', 500);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new ApiError('Background job timed out', 504);
}

/** POST a sync endpoint that returns 202 { jobId }, then wait for completion. */
export async function postSyncAndWait(path: string): Promise<JobStatusResponse> {
  const { jobId } = await request<{ jobId: string }>(path, { method: 'POST', body: JSON.stringify({}) });
  if (!jobId) throw new ApiError('Sync did not return a jobId', 500);
  return pollJobUntilComplete(jobId);
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
