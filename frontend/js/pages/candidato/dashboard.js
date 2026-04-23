// dashboard.js — página principal del candidato
import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

// Redirige si no hay sesión activa
requireAuth();

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', e => {
  e.preventDefault();
  logout();
});

// Mapeo de estados a clases de badge de Bootstrap
const badgeClase = {
  nuevo:      'bg-primary',
  en_proceso: 'bg-warning text-dark',
  contratado: 'bg-success',
  rechazado:  'bg-danger',
};

const badgeLabel = {
  nuevo:      'Nuevo',
  en_proceso: 'En proceso',
  contratado: 'Contratado',
  rechazado:  'Rechazado',
};

const modalidadLabel = {
  presencial: 'Presencial',
  remoto:     'Remoto',
  hibrido:    'Híbrido',
};

// Escapa HTML para evitar XSS
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Muestra hace cuánto tiempo fue creado (simple)
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 30)  return `Hace ${days} días`;
  return new Date(dateStr).toLocaleDateString('es-SV');
}

// Carga datos del dashboard
(async () => {
  try {
    const [posts, vacsResp] = await Promise.all([
      apiFetch('/candidato/postulaciones'),
      apiFetch('/vacantes?limit=5'),
    ]);

    const vacs = vacsResp?.data ?? [];

    // Actualizar stat cards
    document.getElementById('statPostulaciones').textContent = posts.length;
    document.getElementById('statEnProceso').textContent = posts.filter(p => p.status === 'en_proceso').length;
    document.getElementById('statVacantes').textContent = vacs.length;

    // Renderizar postulaciones recientes
    const listaPosts = document.getElementById('listaPostulaciones');
    if (posts.length === 0) {
      listaPosts.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-search fs-2 text-muted d-block mb-2"></i>
          <p class="text-muted small mb-2">Aún no te has postulado a ninguna vacante.</p>
          <a href="/pages/candidato/busqueda.html" class="btn btn-outline-primary btn-sm">Explorar empleos</a>
        </div>`;
    } else {
      listaPosts.innerHTML = '<ul class="list-group list-group-flush">' +
        posts.slice(0, 6).map(p => `
          <li class="list-group-item px-0">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2" style="min-width:0">
                <!-- Iniciales de la empresa como avatar -->
                <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                     style="width:36px;height:36px;flex-shrink:0;background:#1e3a8a;font-size:.75rem">
                  ${esc((p.empresa_nombre ?? 'E').charAt(0).toUpperCase())}
                </div>
                <div style="min-width:0">
                  <div class="small fw-semibold text-truncate">${esc(p.vacante_titulo)}</div>
                  <div class="text-muted" style="font-size:.72rem">${esc(p.empresa_nombre ?? '')} · ${timeAgo(p.created_at)}</div>
                </div>
              </div>
              <span class="badge ${badgeClase[p.status] ?? 'bg-secondary'}">${badgeLabel[p.status] ?? p.status}</span>
            </div>
          </li>
        `).join('') + '</ul>';
    }

    // Renderizar vacantes recientes
    const listaVacs = document.getElementById('listaVacantes');
    if (vacs.length === 0) {
      listaVacs.innerHTML = '<p class="text-muted small">No hay vacantes recientes.</p>';
    } else {
      listaVacs.innerHTML = '<ul class="list-group list-group-flush">' +
        vacs.slice(0, 5).map(v => `
          <li class="list-group-item px-0">
            <a href="/pages/candidato/busqueda.html" class="text-decoration-none text-dark">
              <div class="small fw-semibold text-truncate">${esc(v.titulo)}</div>
              <div class="text-muted" style="font-size:.72rem">
                ${esc(v.empresa_nombre ?? '')} · ${modalidadLabel[v.tipo_trabajo] ?? v.tipo_trabajo ?? ''}
              </div>
            </a>
          </li>
        `).join('') + '</ul>';
      listaVacs.innerHTML += '<a href="/pages/candidato/busqueda.html" class="btn btn-outline-secondary btn-sm w-100 mt-3">Ver más empleos</a>';
    }

  } catch (err) {
    document.getElementById('listaPostulaciones').innerHTML =
      '<div class="alert alert-danger small">Error al cargar los datos del dashboard.</div>';
    console.error(err);
  }
})();
