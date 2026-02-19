import { apiFetch } from './client';
import type { UserLoginCreds, TokenResponse, JwtPayload } from '../types/auth';


export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(base64 + pad);

    return JSON.parse(json);
  } catch (e) {
    console.error('parseJwt error:', e);
    return null;
  }
};

export const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return { user: '—', role: '—', user_id: 0 };

  const p = parseJwt(token);
  return {
    user: p?.user ?? '—',
    role: p?.role ?? '—',
    user_id: p?.user_id ?? 0,
  };
};
export const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // El payload es la segunda parte del JWT (separada por puntos)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    return payload.role; // Retorna "admin" u "operator"
  } catch (e) {
    return null;
  }
};


export const authService = {
  login: async (creds: UserLoginCreds): Promise<void> => {
    const data = await apiFetch<TokenResponse>('/hornero/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds),
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('expires', data.expires.toString());
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('expires');
    window.location.reload();
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const expires = localStorage.getItem('expires');
    if (!token || !expires) return false;

    return Date.now() < parseInt(expires, 10) * 1000;
  },
};
