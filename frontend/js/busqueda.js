// frontend/js/busqueda.js
import { formatSalario, modalidadLabel, badgeForModalidad, contratoLabel, expLabel, timeAgo, escapeHtml, initials } from '/js/helpers.js';

const resultados  = document.getElementById('resultados');
const resultCount = document.getElementById('resultCount');
const inputQ         = document.getElementById('inputQ');
const inputUbicacion = document.getElementById('inputUbicacion');

// ── Leer params de URL y pre-rellenar inputs ─────────────────────────
const sp = new URLSearchParams(location.search);
const qParam  = sp.get('q') || '';
const ubParam = sp.get('ubicacion') || '';
if (qParam)  inputQ.value = qParam;
if (ubParam) inputUbicacion.value = ubParam;

// ── Search form ───────────────────────────────────────────────────────
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q  = inputQ.value.trim();
  const ub = inputUbicacion.value.trim();
  const params = new URLSearchParams();
  if (q)  params.set('q', q);
  if (ub) params.set('ubicacion', ub);
  history.pushState({}, '', '/busqueda.html' + (params.toString() ? `?${params}` : ''));
  cargar(q, ub);
});

// ── Logo / fallback ───────────────────────────────────────────────────
const logoFallback = (nombre) =>
  `<div class="ij-job-logo" style="background:var(--color-primary-15);color:var(--color-primary);font-weight:700;font-size:.875rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">${initials(nombre)}</div>`;

const logoImg = (url, nombre) =>
  url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(nombre)}" class="ij-job-logo" style="object-fit:contain;padding:.25rem;flex-shrink:0" onerror="this.outerHTML=\`${logoFallback(nombre)}\`"/>`
    : logoFallback(nombre);

// ── Render tarjeta resultado ─────────────────────────────────────────
const renderCard = (v) => `
  <a href="/vacante.html?id=${escapeHtml(v.id)}" class="result-card">
    <div class="ij-flex ij-items-start ij-gap-3">
      ${logoImg(v.empresa_logo, v.empresa_nombre)}
      <div style="min-width:0;flex:1">
        <div class="ij-flex ij-items-center ij-gap-2" style="flex-wrap:wrap;margin-bottom:.3rem">
          <span class="ij-font-semibold" style="font-size:1rem">${escapeHtml(v.titulo)}</span>
          <span class="ij-badge ${badgeForModalidad(v.tipo_trabajo)}">${modalidadLabel(v.tipo_trabajo)}</span>
        </div>
        <div class="ij-text-sm ij-text-muted-2" style="margin-bottom:.5rem">
          ${escapeHtml(v.empresa_nombre ?? 'Empresa')} &nbsp;·&nbsp; 📍 ${escapeHtml(v.ubicacion)}
        </div>
        <div class="ij-flex ij-gap-3 ij-items-center" style="flex-wrap:wrap">
          <span class="ij-text-sm ij-font-semibold" style="color:var(--color-secondary)">${formatSalario(v.salario_min, v.salario_max)}</span>
          <span class="ij-badge">${contratoLabel(v.tipo_contrato)}</span>
          <span class="ij-badge">${expLabel(v.experiencia)}</span>
        </div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div class="ij-text-xs ij-text-muted-2">${timeAgo(v.created_at)}</div>
        <div class="ij-text-xs ij-font-semibold ij-text-primary" style="margin-top:.5rem">Ver detalle →</div>
      </div>
    </div>
  </a>
`;

// ── Fetch y render ────────────────────────────────────────────────────
async function cargar(q, ubicacion) {
  resultados.innerHTML = [1,2,3,4].map(() =>
    `<div class="result-card" style="min-height:80px;animation:ij-pulse 1.5s ease-in-out infinite;pointer-events:none"></div>`
  ).join('');

  try {
    const params = new URLSearchParams();
    if (q)        params.set('q', q);
    if (ubicacion) params.set('ubicacion', ubicacion);

    const res = await fetch(`/api/public/vacantes?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data, total } = await res.json();

    resultCount.textContent = total
      ? `${total} vacante${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}`
      : '';

    resultados.innerHTML = data.length
      ? data.map(renderCard).join('')
      : `<div style="text-align:center;padding:4rem 0;color:var(--color-muted)">
           <div style="font-size:2.5rem;margin-bottom:1rem">🔍</div>
           <p style="font-weight:600;margin-bottom:.5rem">No encontramos vacantes</p>
           <p class="ij-text-sm">Intenta con otros términos o deja el buscador en blanco para ver todas.</p>
         </div>`;
  } catch {
    resultados.innerHTML = `<p class="ij-text-danger" style="text-align:center;padding:2rem">Error al cargar resultados. Intenta más tarde.</p>`;
  }
}

// Carga inicial con los params de la URL
cargar(qParam, ubParam);
