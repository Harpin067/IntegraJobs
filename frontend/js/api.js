// frontend/js/api.js
const BASE = '/api';

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Construye un mensaje útil: primero el error general, luego los detalles
    // de validación (express-validator → { campo, mensaje }) si existen.
    let message = data.error ?? `Error ${res.status}`;
    if (Array.isArray(data.details) && data.details.length) {
      const extras = data.details.map(d => `${d.campo}: ${d.mensaje}`).join(' · ');
      message = `${message} — ${extras}`;
    }
    throw Object.assign(new Error(message), { status: res.status, data });
  }
  return data;
};
