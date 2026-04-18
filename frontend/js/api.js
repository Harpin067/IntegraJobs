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

  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error ?? 'Error'), { status: res.status, data });
  return data;
};
