import { apiFetch } from '/js/api.js';
import { modalidadLabel, badgeForModalidad, timeAgo, escapeHtml, initials } from '/js/helpers.js';

const container = document.getElementById('featuredJobs');

const render = (v) => `
  <a href="/pages/login.html" class="ij-job-card">
    <div class="ij-flex ij-items-start ij-gap-3 ij-mb-3">
      <div class="ij-job-logo">${initials(v.empresa_nombre)}</div>
      <div style="min-width:0;flex:1">
        <div class="ij-font-semibold ij-truncate">${escapeHtml(v.titulo)}</div>
        <div class="ij-text-xs ij-text-muted-2">${escapeHtml(v.empresa_nombre ?? 'Empresa')}</div>
      </div>
    </div>
    <div class="ij-flex ij-items-center ij-gap-2" style="flex-wrap:wrap">
      <span class="ij-text-xs ij-text-muted">📍 ${escapeHtml(v.ubicacion)}</span>
      <span class="ij-badge ${badgeForModalidad(v.tipo_trabajo)}">${modalidadLabel(v.tipo_trabajo)}</span>
    </div>
    <div class="ij-flex ij-items-center ij-justify-between ij-mt-4">
      <span class="ij-text-xs ij-text-muted-2">${timeAgo(v.created_at)}</span>
      <span class="ij-text-xs ij-font-semibold ij-text-primary">Ver detalle →</span>
    </div>
  </a>
`;

(async () => {
  try {
    const { data } = await apiFetch('/vacantes?limit=6');
    container.innerHTML = data && data.length
      ? data.slice(0, 3).map(render).join('')
      : '<p class="ij-text-muted" style="grid-column:1/-1;text-align:center">No hay vacantes disponibles aún.</p>';
  } catch {
    container.innerHTML = '<p class="ij-text-danger" style="grid-column:1/-1;text-align:center">Error al cargar vacantes.</p>';
  }
})();
