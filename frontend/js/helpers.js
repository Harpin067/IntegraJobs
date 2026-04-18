// Display helpers shared across the app.
export const modalidadLabel = (t) => ({ presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido' }[t] ?? t);
export const contratoLabel  = (t) => ({ completo: 'Tiempo completo', medio: 'Medio tiempo', temporal: 'Temporal', freelance: 'Freelance' }[t] ?? t);
export const expLabel       = (t) => ({ junior: 'Junior (0-2 años)', mid: 'Mid (2-5 años)', senior: 'Senior (5+ años)', lead: 'Lead / Manager' }[t] ?? t);
export const statusVacanteLabel = (s) => ({ activa: 'Activa', pausada: 'Pausada', cerrada: 'Cerrada', rechazada: 'Rechazada' }[s] ?? s);
export const statusAppLabel = (s) => ({ nuevo: 'Nuevo', en_proceso: 'En proceso', rechazado: 'Rechazado', contratado: 'Contratado' }[s] ?? s);

export const badgeForStatus = (s) => ({
  activa: 'ij-badge-emerald', pausada: 'ij-badge-yellow', cerrada: 'ij-badge', rechazada: 'ij-badge-red',
  nuevo: 'ij-badge-blue', en_proceso: 'ij-badge-yellow', rechazado: 'ij-badge-red', contratado: 'ij-badge-green',
  CANDIDATO: 'ij-badge-green', EMPRESA: 'ij-badge-blue', SUPERADMIN: 'ij-badge-purple',
}[s] ?? 'ij-badge');

export const badgeForModalidad = (m) => ({
  remoto: 'ij-badge-green', presencial: 'ij-badge', hibrido: 'ij-badge-blue',
}[m] ?? 'ij-badge');

export const formatSalario = (min, max) => {
  const n = (v) => v != null ? `$${Number(v).toLocaleString('en-US')}` : null;
  const a = n(min), b = n(max);
  if (a && b) return `${a} – ${b}`;
  if (a) return `Desde ${a}`;
  if (b) return `Hasta ${b}`;
  return 'Salario a convenir';
};

export const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'hace instantes';
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
  if (diff < 2592000) return `hace ${Math.floor(diff/86400)} d`;
  if (diff < 31536000) return `hace ${Math.floor(diff/2592000)} mes`;
  return `hace ${Math.floor(diff/31536000)} años`;
};

export const initials = (str = '') =>
  str.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

export const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
