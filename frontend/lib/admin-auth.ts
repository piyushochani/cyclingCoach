const ADMIN_TOKEN_KEY = 'cyclogenai_admin_token';
const ADMIN_USERNAME_KEY = 'cyclogenai_admin_username';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_USERNAME_KEY);
}

export function getAdminUsername(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(ADMIN_USERNAME_KEY);
  } catch {
    return null;
  }
}

export function setAdminUsername(username: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ADMIN_USERNAME_KEY, username);
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

export function completeAdminSession(token: string, username: string) {
  setAdminToken(token);
  setAdminUsername(username);
}

export function clearAdminSession() {
  clearAdminToken();
}
