import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';
import { badgeForStatus, statusAppLabel, modalidadLabel, timeAgo, escapeHtml, initials } from '/js/helpers.js';

const user = mountShell('CANDIDATO');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');
const firstName = (user.nombre || user.name || user.email || 'Candidato').split(' ')[0];

page.innerHTML = `
  <div style="max-width:1100px;margin:0 auto" class="ij-flex-col ij-gap-4">
    <div class="ij-flex ij-justify-between ij-items-start">
      <div>
        <h1 class="ij-text-xl ij-font-bold">Bienvenido, ${escapeHtml(firstName)}</h1>
        <p class="ij-text-sm ij-text-muted ij-mt-1">Aquí tienes un resumen de tu actividad.</p>
      </div>
      <a href="/pages/candidato/busqueda.html" class="ij-btn ij-btn-primary ij-btn-sm">
        ${renderIcon('briefcase')} Buscar empleos
      </a>
    </div>

    <div class="ij-grid ij-grid-cols-3 ij-gap-4" id="metrics">
      ${metricCard('Postulaciones', '—', 'filetext', 'blue')}
      ${metricCard('En proceso', '—', 'eye', 'emerald')}
      ${metricCard('Vacantes activas', '—', 'briefcase', 'orange')}
    </div>

    <div class="ij-grid ij-gap-4" style="grid-template-columns:2fr 1fr">
      <div class="ij-card">
        <div class="ij-card-header ij-flex ij-justify-between ij-items-center">
          <div class="ij-card-title">Postulaciones recientes</div>
        </div>
        <div class="ij-card-body" id="postulaciones">
          <p class="ij-text-sm ij-text-muted">Cargando...</p>
        </div>
      </div>
      <div class="ij-card">
        <div class="ij-card-header">
          <div class="ij-card-title ij-flex ij-items-center ij-gap-2">
            ${renderIcon('checkCircle')} Vacantes recientes
          </div>
        </div>
        <div class="ij-card-body" id="vacantesRecientes">
          <p class="ij-text-sm ij-text-muted">Cargando...</p>
        </div>
      </div>
    </div>
  </div>
`;

function metricCard(label, value, icon, tone) {
  const bg = { blue:'rgba(26,86,219,.1)', emerald:'rgba(16,185,129,.1)', orange:'rgba(245,158,11,.12)' }[tone];
  const fg = { blue:'var(--color-primary)', emerald:'var(--color-secondary)', orange:'#F59E0B' }[tone];
  return `<div class="ij-card"><div class="ij-card-body">
    <div class="ij-flex ij-justify-between ij-items-center ij-mb-3">
      <div style="background:${bg};color:${fg};padding:.5rem;border-radius:.5rem;display:flex">${renderIcon(icon)}</div>
      <span style="color:#34D399">${renderIcon('trending')}</span>
    </div>
    <div class="ij-text-2xl ij-font-bold" data-metric="${label}">${value}</div>
    <div class="ij-text-xs ij-font-medium ij-text-muted ij-mt-1">${label}</div>
  </div></div>`;
}

const setMetric = (label, value) => {
  const el = page.querySelector(`[data-metric="${label}"]`); if (el) el.textContent = value;
};

(async () => {
  try {
    const [posts, { data: vacs }] = await Promise.all([
      apiFetch('/candidato/postulaciones'),
      apiFetch('/vacantes?limit=5'),
    ]);
    setMetric('Postulaciones', posts.length);
    setMetric('En proceso', posts.filter(p => p.status === 'en_proceso').length);
    setMetric('Vacantes activas', vacs?.length ?? 0);

    const postCt = document.getElementById('postulaciones');
    postCt.innerHTML = posts.length ? posts.slice(0, 6).map(p => `
      <div class="ij-flex ij-justify-between ij-items-center" style="padding:.75rem 0;border-top:1px solid var(--color-border-2)">
        <div class="ij-flex ij-items-center ij-gap-3" style="min-width:0">
          <div class="ij-avatar">${initials(p.empresa_nombre ?? 'E')}</div>
          <div style="min-width:0">
            <div class="ij-text-sm ij-font-medium ij-truncate">${escapeHtml(p.vacante_titulo)}</div>
            <div class="ij-text-xs ij-text-muted-2">${escapeHtml(p.empresa_nombre ?? '')} · ${timeAgo(p.created_at)}</div>
          </div>
        </div>
        <span class="ij-badge ${badgeForStatus(p.status)}">${statusAppLabel(p.status)}</span>
      </div>
    `).join('') : `<div style="text-align:center;padding:2rem 0">
      <div class="ij-text-muted-2 ij-mb-2">${renderIcon('search')}</div>
      <p class="ij-text-sm ij-text-muted">Aún no te has postulado a ninguna vacante.</p>
      <a href="/pages/candidato/busqueda.html" class="ij-btn ij-btn-outline ij-btn-sm ij-mt-2">Explorar empleos</a>
    </div>`;

    const vCt = document.getElementById('vacantesRecientes');
    vCt.innerHTML = (vacs?.length ? vacs.slice(0, 5).map(v => `
      <a href="/pages/candidato/busqueda.html" style="display:block;text-decoration:none;padding:.625rem .25rem;border-top:1px solid var(--color-border-2)">
        <div class="ij-flex ij-justify-between ij-items-center">
          <div style="min-width:0">
            <div class="ij-text-sm ij-font-medium ij-truncate">${escapeHtml(v.titulo)}</div>
            <div class="ij-text-xs ij-text-muted-2">${escapeHtml(v.empresa_nombre ?? '')} · ${modalidadLabel(v.tipo_trabajo)}</div>
          </div>
          <span class="ij-text-muted-2">${renderIcon('arrowUpRight')}</span>
        </div>
      </a>
    `).join('') : '<p class="ij-text-sm ij-text-muted">No hay vacantes recientes.</p>')
      + `<a href="/pages/candidato/busqueda.html" class="ij-btn ij-btn-outline ij-btn-sm ij-btn-block ij-mt-3">Ver más empleos</a>`;
  } catch (e) {
    document.getElementById('postulaciones').innerHTML = '<p class="ij-text-sm ij-text-danger">Error al cargar datos.</p>';
  }
})();
