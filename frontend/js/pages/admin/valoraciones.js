import { apiFetch } from '/js/api.js';
import { requireAuth } from '/js/auth.js';

const user = requireAuth();
if (!user || user.role !== 'SUPERADMIN') {
  window.location.href = '/pages/login.html';
  throw new Error('Unauthorized');
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('es-SV', { day:'2-digit', month:'short', year:'numeric' }) : '—';
}

function stars(n) {
  const filled = Math.round(n ?? 0);
  return Array.from({ length: 5 }, (_, i) =>
    `<i class="bi bi-star${i < filled ? '-fill' : ''}" style="color:${i < filled ? '#f59e0b' : '#d1d5db'}"></i>`
  ).join('');
}

function initials(nombre, apellidos) {
  return ((nombre ?? '')[0] ?? '') + ((apellidos ?? '')[0] ?? '').toUpperCase() || '?';
}

let allValoraciones = [];

// ── Render ────────────────────────────────────────────────
function render() {
  const q      = document.getElementById('q').value.trim().toLowerCase();
  const estado = document.getElementById('fEstado').value;
  const rating = document.getElementById('fRating').value;

  const items = allValoraciones.filter(r => {
    if (estado === 'pendiente' &&  r.is_approved) return false;
    if (estado === 'aprobada'  && !r.is_approved) return false;
    if (rating && String(r.rating) !== rating) return false;
    if (q) {
      const hay = `${r.empresa_nombre ?? ''} ${r.usuario_nombre ?? ''} ${r.usuario_apellidos ?? ''} ${r.usuario_email ?? ''} ${r.comentario ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  document.getElementById('countBadge').textContent = items.length;

  const ct = document.getElementById('valoracionesList');

  if (!items.length) {
    ct.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-star fs-1 d-block mb-2 opacity-25"></i>
        <div class="small">Sin resultados para los filtros aplicados.</div>
      </div>`;
    return;
  }

  ct.innerHTML = items.map(r => {
    const nombre = `${r.usuario_nombre ?? ''} ${r.usuario_apellidos ?? ''}`.trim() || 'Usuario';
    return `
    <div class="px-4 py-4" style="border-bottom:1px solid #f1f5f9" data-id="${esc(r.id)}">
      <div class="d-flex align-items-start gap-3">

        <!-- Avatar candidato -->
        <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
             style="width:40px;height:40px;background:linear-gradient(135deg,#1e40af,#1e3a8a);font-size:.8rem">
          ${esc(initials(r.usuario_nombre, r.usuario_apellidos))}
        </div>

        <div class="flex-grow-1 min-width-0">
          <!-- Cabecera -->
          <div class="d-flex align-items-start justify-content-between gap-2 mb-1 flex-wrap">
            <div>
              <span class="fw-semibold small">${esc(nombre)}</span>
              <span class="text-muted small"> sobre </span>
              <span class="fw-semibold small text-primary">${esc(r.empresa_nombre ?? '—')}</span>
            </div>
            <div class="d-flex align-items-center gap-2 flex-shrink-0">
              ${r.is_approved
                ? `<span class="badge px-2 py-1" style="background:#d1fae5;color:#065f46;font-size:.7rem"><i class="bi bi-check-circle me-1"></i>Aprobada</span>`
                : `<span class="badge px-2 py-1" style="background:#fef3c7;color:#92400e;font-size:.7rem"><i class="bi bi-hourglass-split me-1"></i>Pendiente</span>`
              }
            </div>
          </div>

          <!-- Email y fecha -->
          <div class="text-muted mb-2" style="font-size:.72rem">
            <i class="bi bi-envelope me-1"></i>${esc(r.usuario_email ?? '—')}
            · <i class="bi bi-calendar me-1"></i>${fmt(r.created_at)}
          </div>

          <!-- Estrellas -->
          <div class="mb-2">${stars(r.rating)}</div>

          <!-- Comentario -->
          <div class="p-3 rounded-3 small mb-3"
               style="background:#f8fafc;border:1px solid #e2e8f0;white-space:pre-wrap;line-height:1.7">
            ${esc(r.comentario)}
          </div>

          <!-- Acciones -->
          <div class="d-flex gap-2">
            ${!r.is_approved ? `
              <button class="btn btn-success btn-sm btn-aprobar" data-id="${esc(r.id)}">
                <i class="bi bi-check-lg me-1"></i> Aprobar
              </button>
              <button class="btn btn-outline-danger btn-sm btn-rechazar" data-id="${esc(r.id)}">
                <i class="bi bi-x-lg me-1"></i> Rechazar
              </button>
            ` : `
              <button class="btn btn-outline-warning btn-sm btn-rechazar" data-id="${esc(r.id)}">
                <i class="bi bi-x-lg me-1"></i> Retirar aprobación
              </button>
            `}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  // Botones aprobar
  ct.querySelectorAll('.btn-aprobar').forEach(btn => {
    btn.addEventListener('click', () => accion(btn.dataset.id, true, btn));
  });

  // Botones rechazar/retirar
  ct.querySelectorAll('.btn-rechazar').forEach(btn => {
    btn.addEventListener('click', () => accion(btn.dataset.id, false, btn));
  });
}

async function accion(id, aprobar, btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

  try {
    await apiFetch(`/admin/valoraciones/${id}/aprobar`, {
      method: 'PATCH',
      body: JSON.stringify({ aprobar }),
    });
    await load();
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
  }
}

// ── Carga ─────────────────────────────────────────────────
async function load() {
  try {
    allValoraciones = await apiFetch('/admin/valoraciones');

    const total     = allValoraciones.length;
    const aprobadas = allValoraciones.filter(r => r.is_approved).length;

    document.getElementById('kpiTotal').textContent     = total;
    document.getElementById('kpiAprobadas').textContent = aprobadas;
    document.getElementById('kpiPend').textContent      = total - aprobadas;

    render();
  } catch (err) {
    document.getElementById('valoracionesList').innerHTML = `
      <div class="alert alert-danger m-3">Error al cargar valoraciones: ${esc(err.message)}</div>`;
  }
}

document.getElementById('q').addEventListener('input', render);
document.getElementById('fEstado').addEventListener('change', render);
document.getElementById('fRating').addEventListener('change', render);

load();
