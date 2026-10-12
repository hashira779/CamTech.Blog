export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Token expired
    }
    return true;
  } catch {
    return false;
  }
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (!isTokenValid(token)) {
    logout();
    return null;
  }
  return token;
}

export function getUser(): AdminUser | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as AdminUser;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AdminUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth_state_change'));
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('auth_state_change'));
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
