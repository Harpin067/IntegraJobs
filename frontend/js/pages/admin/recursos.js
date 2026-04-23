// frontend/js/pages/admin/recursos.js
import { apiFetch } from '/js/api.js';
import { requireAuth } from '/js/auth.js';

const user = requireAuth();
if (!user || user.role !== 'SUPERADMIN') {
  window.location.href = '/pages/login.html';
  throw new Error('Unauthorized');
}

// ── Helpers ────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('es-SV', { day:'2-digit', month:'short', year:'numeric' })
  : '—';

const TIPO_BADGE = {
  articulo: 'bg-primary',
  tutorial: 'bg-success',
  video:    'bg-danger',
};
const TIPO_ICON = {
  articulo: 'bi-file-earmark-text',
  tutorial: 'bi-mortarboard',
  video:    'bi-play-circle',
};

// ── Feedback global ────────────────────────────────────────
function feedback(msg, tipo = 'success') {
  const el = document.getElementById('alertaGlobal');
  el.textContent = msg;
  el.className   = `alert alert-${tipo} mb-3`;
  el.classList.remove('d-none');
  setTimeout(() => el.classList.add('d-none'), 4000);
}

function feedbackModal(msg) {
  const el = document.getElementById('alertaModal');
  el.textContent = msg;
  el.classList.remove('d-none');
}

function clearModalAlert() {
  const el = document.getElementById('alertaModal');
  el.textContent = '';
  el.classList.add('d-none');
}

// ── Render tabla ───────────────────────────────────────────
let recursos = [];

function renderTabla() {
  const body   = document.getElementById('tablaBody');
  const badge  = document.getElementById('badgeTotal');
  badge.textContent = recursos.length;

  if (!recursos.length) {
    body.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5 text-muted">
          <i class="bi bi-collection fs-1 d-block mb-2 opacity-25"></i>
          <div class="small">No hay recursos aún. Crea el primero.</div>
        </td>
      </tr>`;
    return;
  }

  body.innerHTML = recursos.map(r => `
    <tr data-id="${esc(r.id)}">
      <td class="px-3 py-3">
        <div class="d-flex align-items-start gap-2">
          <i class="bi ${TIPO_ICON[r.tipo] ?? 'bi-file'} text-primary mt-1 flex-shrink-0"></i>
          <div>
            <div class="fw-semibold text-truncate" style="max-width:320px">${esc(r.titulo)}</div>
            <div class="text-muted small text-truncate" style="max-width:320px">${esc(r.contenido)}</div>
          </div>
        </div>
      </td>
      <td class="px-3 py-3">
        <span class="badge ${TIPO_BADGE[r.tipo] ?? 'bg-secondary'} text-capitalize">${esc(r.tipo)}</span>
      </td>
      <td class="px-3 py-3">
        ${r.is_published
          ? `<span class="badge px-2 py-1" style="background:#d1fae5;color:#065f46"><i class="bi bi-eye me-1"></i>Publicado</span>`
          : `<span class="badge px-2 py-1" style="background:#f3f4f6;color:#6b7280"><i class="bi bi-eye-slash me-1"></i>Borrador</span>`}
      </td>
      <td class="px-3 py-3 text-muted small">${fmt(r.created_at)}</td>
      <td class="px-3 py-3 text-end">
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-sm btn-outline-secondary btn-toggle"
                  data-id="${esc(r.id)}"
                  title="${r.is_published ? 'Pasar a borrador' : 'Publicar'}">
            <i class="bi ${r.is_published ? 'bi-eye-slash' : 'bi-eye'}"></i>
            ${r.is_published ? 'Despublicar' : 'Publicar'}
          </button>
          <button class="btn btn-sm btn-outline-danger btn-del" data-id="${esc(r.id)}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Toggle publicado
  body.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        const updated = await apiFetch(`/admin/recursos/${btn.dataset.id}/toggle`, { method: 'PATCH' });
        const rec = recursos.find(r => r.id === btn.dataset.id);
        if (rec) rec.is_published = updated.is_published;
        renderTabla();
        feedback(`Recurso ${updated.is_published ? 'publicado' : 'despublicado'} correctamente.`);
      } catch (err) {
        feedback(err.message, 'danger');
        btn.disabled = false;
      }
    });
  });

  // Eliminar
  body.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rec = recursos.find(r => r.id === btn.dataset.id);
      if (!confirm(`¿Eliminar el recurso "${rec?.titulo ?? ''}"? Esta acción no se puede deshacer.`)) return;
      btn.disabled = true;
      try {
        await apiFetch(`/admin/recursos/${btn.dataset.id}`, { method: 'DELETE' });
        recursos = recursos.filter(r => r.id !== btn.dataset.id);
        renderTabla();
        feedback('Recurso eliminado correctamente.');
      } catch (err) {
        feedback(err.message, 'danger');
        btn.disabled = false;
      }
    });
  });
}

// ── Carga inicial ──────────────────────────────────────────
async function cargar() {
  try {
    recursos = await apiFetch('/admin/recursos');
    renderTabla();
  } catch (err) {
    document.getElementById('tablaBody').innerHTML = `
      <tr><td colspan="5" class="text-center py-4 text-danger small">
        Error al cargar recursos: ${esc(err.message)}
      </td></tr>`;
  }
}

// ── Formulario de creación ─────────────────────────────────
const form         = document.getElementById('formRecurso');
const btnGuardar   = document.getElementById('btnGuardar');
const modalEl      = document.getElementById('modalRecurso');
const modalInst    = new bootstrap.Modal(modalEl);

modalEl.addEventListener('hidden.bs.modal', () => {
  form.reset();
  clearModalAlert();
  btnGuardar.disabled = false;
  btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar recurso';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearModalAlert();

  const titulo    = form.elements.titulo.value.trim();
  const tipo      = form.elements.tipo.value;
  const contenido = form.elements.contenido.value.trim();
  const imagenUrl = form.elements.imagenUrl.value.trim() || null;
  const isPublished = form.elements.isPublished.checked;

  if (!titulo)    return feedbackModal('El título es requerido.');
  if (!tipo)      return feedbackModal('Selecciona un tipo de recurso.');
  if (!contenido) return feedbackModal('El contenido es requerido.');

  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

  try {
    const nuevo = await apiFetch('/admin/recursos', {
      method: 'POST',
      body: JSON.stringify({ titulo, tipo, contenido, imagenUrl, isPublished }),
    });
    recursos.unshift(nuevo);
    renderTabla();
    modalInst.hide();
    feedback('Recurso creado correctamente.');
  } catch (err) {
    feedbackModal(err.message ?? 'Error al guardar el recurso.');
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar recurso';
  }
});

cargar();
