// frontend/js/auth.js
import { apiFetch } from './api.js';

const BASE = '/api';

export const getToken = () => localStorage.getItem('token');
export const getUser  = () => JSON.parse(localStorage.getItem('user') ?? 'null');

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
};

export const redirectByRole = (role) => {
  const routes = {
    CANDIDATO:  '/pages/candidato/dashboard.html',
    EMPRESA:    '/pages/empresa/dashboard.html',
    SUPERADMIN: '/pages/admin/dashboard.html',
  };
  window.location.href = routes[role] ?? '/';
};

export const requireAuth = () => {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = '/pages/login.html';
    return null;
  }
  return user;
};

export const login = async (email, password, attemptedRole, remember = false) => {
  // Login usa fetch directo para que un 401 de credenciales incorrectas
  // no active el interceptor global de apiFetch (que redirige a login).
  const loginType = String(attemptedRole ?? 'candidato').toLowerCase();

  const res  = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, loginType }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let message = data.error ?? `Error ${res.status}`;
    if (Array.isArray(data.details) && data.details.length) {
      const extras = data.details.map(d => `${d.campo}: ${d.mensaje}`).join(' · ');
      message = `${message} — ${extras}`;
    }
    throw Object.assign(new Error(message), { status: res.status, data });
  }

  // Persistencia según "Recordarme": sessionStorage se borra al cerrar la pestaña.
  // localStorage siempre se actualiza para que apiFetch encuentre el token.
  if (remember) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  } else {
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return data.user;
};
