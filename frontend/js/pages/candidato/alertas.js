// frontend/js/pages/candidato/alertas.js
import { apiFetch } from '/js/api.js';
import { requireAuth } from '/js/auth.js';

requireAuth();

const listEl     = document.getElementById('alertasList');
const successEl  = document.getElementById('successMsg');
const errorEl    = document.getElementById('errorMsg');

const MODALIDAD = { presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido' };

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function flash(el, msg) {
  el.textContent = msg;
  el.classList.remove('d-none');
  const otro = el === successEl ? errorEl : successEl;
  otro.classList.add('d-none');
  setTimeout(() => el.classList.add('d-none'), 4000);
}

// ── Render ────────────────────────────────────────────────────────────────
function renderAlerta(a) {
  const meta = [a.ubicacion, MODALIDAD[a.tipo_trabajo]].filter(Boolean).join(' · ') || 'Sin filtros adicionales';

  return `
    <div class="d-flex justify-content-between align-items-center py-3 border-bottom">
      <div class="d-flex align-items-center gap-3" style="min-width:0">
        <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
             style="width:2.25rem;height:2.25rem;
                    background:${a.is_active ? 'rgba(16,185,129,.12)' : '#f3f4f6'};
                    color:${a.is_active ? '#10b981' : '#9ca3af'}">
          <i class="bi bi-bell${a.is_active ? '' : '-slash'}"></i>
        </div>
        <div style="min-width:0">
          <div class="fw-semibold small text-truncate">${esc(a.keyword)}</div>
          <div class="text-muted" style="font-size:.72rem">${esc(meta)}</div>
          <div style="font-size:.68rem;margin-top:.15rem">
            ${a.is_active
              ? '<span class="text-success fw-semibold">Activa</span>'
              : '<span class="text-secondary">Pausada</span>'}
          </div>
        </div>
      </div>
      <div class="d-flex gap-2 flex-shrink-0 ms-3">
        <button class="btn btn-outline-secondary btn-sm btn-toggle"
                data-id="${esc(a.id)}"
                title="${a.is_active ? 'Pausar' : 'Activar'}">
          <i class="bi ${a.is_active ? 'bi-pause-fill' : 'bi-play-fill'}"></i>
          ${a.is_active ? 'Pausar' : 'Activar'}
        </button>
        <button class="btn btn-outline-danger btn-sm btn-del"
                data-id="${esc(a.id)}"
                title="Eliminar alerta">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>`;
}

// ── Carga ─────────────────────────────────────────────────────────────────
async function cargarAlertas() {
  try {
    const alertas = await apiFetch('/candidato/alertas');

    if (!alertas.length) {
      listEl.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="bi bi-bell-slash fs-1 d-block mb-2 opacity-25"></i>
          <div class="small">No tienes alertas configuradas.<br>Crea una arriba para recibir notificaciones.</div>
        </div>`;
      return;
    }

    listEl.innerHTML = alertas.map(renderAlerta).join('');
  } catch {
    listEl.innerHTML = `<div class="alert alert-danger small">Error al cargar alertas. Intenta más tarde.</div>`;
  }
}

// ── Event delegation sobre la lista ──────────────────────────────────────
listEl.addEventListener('click', async (e) => {
  // Toggle activa/pausada
  const btnToggle = e.target.closest('.btn-toggle');
  if (btnToggle) {
    btnToggle.disabled = true;
    try {
      await apiFetch(`/candidato/alertas/${btnToggle.dataset.id}/toggle`, { method: 'PATCH' });
      await cargarAlertas();
    } catch (err) {
      flash(errorEl, err.message ?? 'Error al cambiar el estado.');
      btnToggle.disabled = false;
    }
    return;
  }

  // Eliminar
  const btnDel = e.target.closest('.btn-del');
  if (btnDel) {
    if (!confirm('¿Eliminar esta alerta? Esta acción no se puede deshacer.')) return;
    btnDel.disabled = true;
    try {
      await apiFetch(`/candidato/alertas/${btnDel.dataset.id}`, { method: 'DELETE' });
      flash(successEl, 'Alerta eliminada correctamente.');
      await cargarAlertas();
    } catch (err) {
      flash(errorEl, err.message ?? 'Error al eliminar.');
      btnDel.disabled = false;
    }
  }
});

// ── Crear alerta ──────────────────────────────────────────────────────────
document.getElementById('alertaForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const keyword     = document.getElementById('aKeyword').value.trim();
  const ubicacion   = document.getElementById('aUbicacion').value.trim() || undefined;
  const tipoTrabajo = document.getElementById('aTipoTrabajo').value       || undefined;

  if (!keyword) {
    flash(errorEl, 'La palabra clave es obligatoria.');
    return;
  }

  const btn = e.submitter ?? e.target.querySelector('[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creando...';

  try {
    await apiFetch('/candidato/alertas', {
      method: 'POST',
      body: JSON.stringify({ keyword, ubicacion, tipoTrabajo }),
    });
    e.target.reset();
    flash(successEl, `Alerta "${keyword}" creada correctamente.`);
    await cargarAlertas();
  } catch (err) {
    flash(errorEl, err.message ?? 'Error al crear la alerta.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-plus-lg"></i> Crear';
  }
});

// ── Inicio ────────────────────────────────────────────────────────────────
cargarAlertas();
