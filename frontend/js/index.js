// frontend/js/index.js
import { formatSalario, modalidadLabel, badgeForModalidad, timeAgo, escapeHtml, initials } from '/js/helpers.js';

const container      = document.getElementById('featuredJobs');
const statVacantes   = document.getElementById('statVacantes');
const statEmpresas   = document.getElementById('statEmpresas');
const heroIndustrias = document.getElementById('heroIndustrias');

document.getElementById('heroSearch').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const q         = fd.get('q')?.trim();
  const ubicacion = fd.get('ubicacion')?.trim();
  const params = new URLSearchParams();
  if (q)        params.set('q', q);
  if (ubicacion) params.set('ubicacion', ubicacion);
  const qs = params.toString();
  window.location.href = '/pages/login.html' + (qs ? `?${qs}` : '');
});

const logoFallback = (nombre) =>
  `<div class="ij-job-logo" style="background:var(--color-primary-15);color:var(--color-primary);font-weight:700;font-size:.875rem;display:flex;align-items:center;justify-content:center">${initials(nombre)}</div>`;

const logoImg = (url, nombre) =>
  url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(nombre)}" class="ij-job-logo" style="object-fit:contain;padding:.25rem" onerror="this.outerHTML=\`${logoFallback(nombre)}\`"/>`
    : logoFallback(nombre);

const renderCard = (v) => `
  <a href="/pages/login.html" class="ij-job-card">
    <div class="ij-flex ij-items-start ij-gap-3 ij-mb-3">
      ${logoImg(v.empresa_logo, v.empresa_nombre)}
      <div style="min-width:0;flex:1">
        <div class="ij-font-semibold ij-truncate">${escapeHtml(v.titulo)}</div>
        <div class="ij-text-xs ij-text-muted-2">${escapeHtml(v.empresa_nombre ?? 'Empresa')}</div>
      </div>
    </div>
    <div class="ij-flex ij-items-center ij-gap-2" style="flex-wrap:wrap;margin-bottom:.75rem">
      <span class="ij-text-xs ij-text-muted">📍 ${escapeHtml(v.ubicacion)}</span>
      <span class="ij-badge ${badgeForModalidad(v.tipo_trabajo)}">${modalidadLabel(v.tipo_trabajo)}</span>
    </div>
    <div class="ij-text-xs ij-font-semibold" style="color:var(--color-secondary);margin-bottom:.5rem">
      ${formatSalario(v.salario_min, v.salario_max)}
    </div>
    <div class="ij-flex ij-items-center ij-justify-between ij-mt-2">
      <span class="ij-text-xs ij-text-muted-2">${timeAgo(v.created_at)}</span>
      <span class="ij-text-xs ij-font-semibold ij-text-primary">Ver detalle →</span>
    </div>
  </a>
`;

const skeletonCard = () => `
  <div class="ij-job-card" style="pointer-events:none;animation:ij-pulse 1.5s ease-in-out infinite">
    <div style="display:flex;gap:.75rem;margin-bottom:.75rem">
      <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius);background:var(--color-border-2);flex-shrink:0"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:.5rem">
        <div style="height:.875rem;border-radius:var(--radius-sm);background:var(--color-border-2);width:70%"></div>
        <div style="height:.75rem;border-radius:var(--radius-sm);background:var(--color-border-2);width:45%"></div>
      </div>
    </div>
    <div style="height:.75rem;border-radius:var(--radius-sm);background:var(--color-border-2);width:55%;margin-bottom:.5rem"></div>
    <div style="height:.75rem;border-radius:var(--radius-sm);background:var(--color-border-2);width:40%"></div>
  </div>
`;

container.innerHTML = [1, 2, 3].map(skeletonCard).join('');

(async () => {
  try {
    const res = await fetch('/api/public/stats');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { totalVacantes, totalEmpresas, vacantesRecientes, topIndustrias } = await res.json();

    statVacantes.textContent = totalVacantes > 0 ? `+${totalVacantes.toLocaleString()}` : '0';
    statEmpresas.textContent = totalEmpresas > 0 ? `+${totalEmpresas.toLocaleString()}` : '0';

    if (topIndustrias.length) {
      heroIndustrias.innerHTML = topIndustrias
        .map(i => `<a href="/pages/login.html?industria=${encodeURIComponent(i.industria)}" class="ij-badge" style="background:rgba(255,255,255,.15);color:#fff;cursor:pointer">${escapeHtml(i.industria)}</a>`)
        .join('');
    }

    container.innerHTML = vacantesRecientes.length
      ? vacantesRecientes.map(renderCard).join('')
      : '<p class="ij-text-muted" style="grid-column:1/-1;text-align:center;padding:2rem 0">No hay vacantes disponibles aún.</p>';

  } catch {
    container.innerHTML = '<p class="ij-text-danger" style="grid-column:1/-1;text-align:center;padding:2rem 0">Error al cargar vacantes. Intenta más tarde.</p>';
  }
})();
