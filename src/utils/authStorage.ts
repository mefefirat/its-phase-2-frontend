// src/utils/authStorage.ts
export interface AuthUser {
  id?: string;
  username?: string;
  email?: string;
  full_name?: string;
  role?: 'admin' | 'teamleader' | 'workkerf1' | 'workkerf2';
  is_admin?: boolean;
  isAdmin?: boolean;
}

interface StoredAuthData {
  token: string;
  user?: AuthUser;
}

const AUTH_STORAGE_KEY = 'auth_token_v1';

export const authStorage = {
  save(data: StoredAuthData) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  },
  load(): StoredAuthData | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },
  clear() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (_) {}
  },
  getToken(): string | null {
    return this.load()?.token || null;
  },
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    // If JWT, check exp; otherwise assume valid
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    try {
      const payload = JSON.parse(atob(parts[1]));
      if (payload && typeof payload.exp === 'number') {
        const nowSec = Math.floor(Date.now() / 1000);
        return payload.exp > nowSec;
      }
      return true;
    } catch (_) {
      return true;
    }
  }
};




