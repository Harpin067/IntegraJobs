import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';
import { badgeForStatus, statusVacanteLabel, modalidadLabel, timeAgo, escapeHtml } from '/js/helpers.js';

const user = mountShell('EMPRESA');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');

page.innerHTML = `
  <div style="max-width:1100px;margin:0 auto" class="ij-flex-col ij-gap-4">
    <div class="ij-flex ij-justify-between ij-items-start">
      <div>
        <h1 class="ij-text-xl ij-font-bold" id="pageTitle">Panel de Empresa</h1>
        <p class="ij-text-sm ij-text-muted ij-mt-1" id="pageSub">Gestiona tus vacantes y candidatos.</p>
      </div>
      <a href="/pages/empresa/crear-vacante.html" class="ij-btn ij-btn-primary ij-btn-sm">
        ${renderIcon('plusCircle')} Publicar Vacante
      </a>
    </div>

    <div class="ij-grid ij-grid-cols-3 ij-gap-4" id="metrics">
      ${metric('Vacantes Activas', '—', 'briefcase', 'blue')}
      ${metric('Total Postulantes', '—', 'users', 'emerald')}
      ${metric('En Proceso', '—', 'calendar', 'orange')}
    </div>

    <div class="ij-card">
      <div class="ij-card-header"><div class="ij-card-title">Últimas vacantes publicadas</div></div>
      <div class="ij-card-body" id="vacantesList">
        <p class="ij-text-sm ij-text-muted">Cargando...</p>
      </div>
    </div>
  </div>
`;

function metric(label, value, icon, tone) {
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
const setM = (l, v) => { const e = page.querySelector(`[data-metric="${l}"]`); if (e) e.textContent = v; };

(async () => {
  try {
    const [perfil, vacantes] = await Promise.all([
      apiFetch('/empresa/perfil'),
      apiFetch('/empresa/vacantes'),
    ]);

    document.getElementById('pageSub').textContent =
      (perfil?.nombre ? `${perfil.nombre} · ` : '') + 'Gestiona tus vacantes y candidatos.';

    const activas = vacantes.filter(v => v.status === 'activa').length;
    const totalApps = vacantes.reduce((s, v) => s + Number(v.total_aplicaciones ?? 0), 0);
    setM('Vacantes Activas', activas);
    setM('Total Postulantes', totalApps);
    setM('En Proceso', '—');

    const ct = document.getElementById('vacantesList');
    if (!vacantes.length) {
      ct.innerHTML = `
        <div style="text-align:center;padding:2.5rem 0">
          <div style="color:var(--color-muted-2);margin-bottom:.5rem">${renderIcon('briefcase')}</div>
          <p class="ij-text-sm ij-text-muted ij-mb-3">Aún no has publicado ninguna vacante</p>
          <a href="/pages/empresa/crear-vacante.html" class="ij-btn ij-btn-primary ij-btn-sm">Crear nueva vacante</a>
        </div>`;
      return;
    }
    ct.innerHTML = `
      <div class="ij-grid" style="grid-template-columns:2fr 1fr 1fr;gap:.5rem;padding-bottom:.5rem;border-bottom:1px solid var(--color-border-2)">
        <span class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-transform:uppercase;letter-spacing:.05em">Puesto</span>
        <span class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-align:center;text-transform:uppercase;letter-spacing:.05em">Postulantes</span>
        <span class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-align:right;text-transform:uppercase;letter-spacing:.05em">Estado</span>
      </div>
      ${vacantes.slice(0, 10).map(v => `
        <a href="/pages/empresa/vacantes.html#${v.id}" class="ij-grid" style="grid-template-columns:2fr 1fr 1fr;align-items:center;gap:.5rem;padding:.75rem .25rem;border-top:1px solid var(--color-border-2);text-decoration:none;color:inherit">
          <div style="min-width:0">
            <div class="ij-text-sm ij-font-medium ij-truncate">${escapeHtml(v.titulo)}</div>
            <div class="ij-text-xs ij-text-muted-2">${escapeHtml(v.ubicacion)} · ${modalidadLabel(v.tipo_trabajo)} · ${timeAgo(v.created_at)}</div>
          </div>
          <div class="ij-text-sm ij-font-semibold" style="text-align:center">${v.total_aplicaciones ?? 0}</div>
          <div style="text-align:right">
            <span class="ij-badge ${badgeForStatus(v.status)}">${statusVacanteLabel(v.status)}</span>
          </div>
        </a>
      `).join('')}
    `;
  } catch (e) {
    document.getElementById('vacantesList').innerHTML = '<p class="ij-text-sm ij-text-danger">Error al cargar.</p>';
  }
})();
