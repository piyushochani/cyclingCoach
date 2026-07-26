import { clearApiCache, setToken } from './api';

export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cyclogenai_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem('cyclogenai_token');
  } catch {
    return false;
  }
}

/** Call after login, signup, or password reset — stores session and notifies the app. */
export function completeAuthSession(
  token: string,
  user: Record<string, unknown>,
  options?: { isSignup?: boolean },
) {
  setToken(token);
  localStorage.setItem('cyclogenai_user', JSON.stringify(user));
  localStorage.setItem('cyclogenai_signed_in', 'true');
  localStorage.removeItem('cyclogenai_onboarding_done');
  // Force a fresh Strava sync on the next authenticated mount.
  localStorage.removeItem('cyclogenai_last_sync');
  localStorage.removeItem('cyclogenai_sync_status');
  clearApiCache();
  window.dispatchEvent(
    new CustomEvent('auth-session-changed', {
      detail: { isSignup: !!options?.isSignup, user },
    }),
  );
}

export function clearAuthSession() {
  localStorage.removeItem('cyclogenai_token');
  localStorage.removeItem('cyclogenai_user');
  localStorage.removeItem('cyclogenai_signed_in');
  localStorage.removeItem('cyclogenai_onboarding_done');
  localStorage.removeItem('cyclogenai_last_sync');
  localStorage.removeItem('cyclogenai_sync_status');
  clearApiCache();
  window.dispatchEvent(new CustomEvent('auth-session-changed', { detail: { logout: true } }));
}
