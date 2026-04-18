// frontend/js/auth.js
import { apiFetch } from './api.js';

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

export const login = async (email, password, loginType) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, loginType }),
  });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
};
