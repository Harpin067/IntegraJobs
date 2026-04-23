import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

const user = requireAuth();
if (!user || user.role !== 'SUPERADMIN') {
  window.location.href = '/pages/login.html';
  throw new Error('Unauthorized');
}

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60)    return 'hace un momento';
  if (d < 3600)  return `hace ${Math.floor(d / 60)} min`;
  if (d < 86400) return `hace ${Math.floor(d / 3600)} h`;
  return `hace ${Math.floor(d / 86400)} d`;
}

let allThreads = [];

// ── Carga inicial ────────────────────────────────────────
async function cargar() {
  const [cats, threads] = await Promise.all([
    apiFetch('/admin/foros/categorias'),
    apiFetch('/admin/foros/threads'),
  ]);
  allThreads = threads;

  document.getElementById('kpiCats').textContent    = cats.length;
  document.getElementById('kpiThreads').textContent = threads.length;
  document.getElementById('kpiPend').textContent    = threads.filter(t => !t.is_approved).length;

  renderCategorias(cats);
  renderThreads(threads);
}

// ── Categorías ───────────────────────────────────────────
function renderCategorias(cats) {
  const ct = document.getElementById('categoriasList');
  if (!cats.length) {
    ct.innerHTML = `<div class="text-center text-muted py-5 small">No hay categorías. Crea una.</div>`;
    return;
  }
  ct.innerHTML = cats.map(c => `
    <div class="d-flex align-items-center gap-3 px-3 py-3" style="border-bottom:1px solid #f1f5f9">
      <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
           style="width:40px;height:40px;background:#e0e7ff;color:#1e40af;font-size:1.1rem">
        <i class="bi bi-chat-square-text"></i>
      </div>
      <div class="flex-grow-1 min-w-0">
        <div class="fw-semibold small text-truncate">${esc(c.nombre)}</div>
        <div class="text-muted" style="font-size:.72rem">${c.total_threads} hilos · ${c.total_replies} respuestas</div>
      </div>
      <button class="btn btn-outline-danger btn-sm flex-shrink-0" data-del-cat="${esc(c.id)}" title="Eliminar categoría">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
  `).join('');

  ct.querySelectorAll('[data-del-cat]').forEach(btn => {
    btn.addEventListener('click', () => eliminarCategoria(btn.dataset.delCat, btn));
  });
}

async function eliminarCategoria(id, btn) {
  if (!confirm('¿Eliminar esta categoría y todos sus hilos? Esta acción no se puede deshacer.')) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  try {
    await apiFetch(`/admin/foros/categorias/${id}`, { method: 'DELETE' });
    cargar();
  } catch (e) {
    alert('Error: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash3"></i>';
  }
}

// ── Hilos ────────────────────────────────────────────────
function renderThreads(threads) {
  const ct = document.getElementById('threadsList');
  if (!threads.length) {
    ct.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-chat-left-text fs-1 d-block mb-2 opacity-25"></i>
        <div class="small">No hay hilos en esta vista.</div>
      </div>`;
    return;
  }
  ct.innerHTML = threads.map(t => `
    <div class="d-flex align-items-start gap-3 px-3 py-3" style="border-bottom:1px solid #f1f5f9">
      <div class="flex-grow-1 min-w-0">
        <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
          <span class="badge rounded-pill px-2" style="font-size:.68rem;background:${t.is_approved ? '#d1fae5' : '#fef3c7'};color:${t.is_approved ? '#065f46' : '#92400e'}">
            ${t.is_approved ? 'Aprobado' : 'Pendiente'}
          </span>
          <span class="fw-semibold small text-truncate">${esc(t.titulo)}</span>
        </div>
        <div class="text-muted" style="font-size:.72rem">
          <i class="bi bi-folder me-1"></i>${esc(t.categoria)}
          &nbsp;·&nbsp; ${esc(t.nombre)} ${esc(t.apellidos)}
          &nbsp;·&nbsp; ${timeAgo(t.created_at)}
          &nbsp;·&nbsp; ${t.total_replies} resp.
        </div>
      </div>
      <div class="d-flex gap-1 flex-shrink-0">
        ${!t.is_approved
          ? `<button class="btn btn-success btn-sm" data-approve="${esc(t.id)}" title="Aprobar">
               <i class="bi bi-check-lg"></i>
             </button>`
          : `<button class="btn btn-outline-secondary btn-sm" data-reject="${esc(t.id)}" title="Desaprobar">
               <i class="bi bi-slash-circle"></i>
             </button>`
        }
        <button class="btn btn-outline-danger btn-sm" data-del-thread="${esc(t.id)}" title="Eliminar">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </div>
  `).join('');

  ct.querySelectorAll('[data-approve]').forEach(btn => {
    btn.addEventListener('click', () => moderarThread(btn.dataset.approve, true, btn));
  });
  ct.querySelectorAll('[data-reject]').forEach(btn => {
    btn.addEventListener('click', () => moderarThread(btn.dataset.reject, false, btn));
  });
  ct.querySelectorAll('[data-del-thread]').forEach(btn => {
    btn.addEventListener('click', () => eliminarThread(btn.dataset.delThread, btn));
  });
}

async function moderarThread(threadId, aprobar, btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  try {
    await apiFetch(`/admin/foros/threads/${threadId}/moderar`, {
      method: 'PATCH',
      body: JSON.stringify({ aprobar }),
    });
    cargar();
  } catch (e) {
    alert('Error: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = aprobar ? '<i class="bi bi-check-lg"></i>' : '<i class="bi bi-slash-circle"></i>';
  }
}

async function eliminarThread(threadId, btn) {
  if (!confirm('¿Eliminar este hilo y todas sus respuestas?')) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  try {
    await apiFetch(`/admin/foros/threads/${threadId}`, { method: 'DELETE' });
    cargar();
  } catch (e) {
    alert('Error: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash3"></i>';
  }
}

// ── Filtro hilos ─────────────────────────────────────────
document.getElementById('filterThread').addEventListener('change', (e) => {
  const v = e.target.value;
  const filtered = v === 'pendiente'
    ? allThreads.filter(t => !t.is_approved)
    : v === 'aprobado'
      ? allThreads.filter(t => t.is_approved)
      : allThreads;
  renderThreads(filtered);
});

// ── Modal nueva categoría ─────────────────────────────────
document.getElementById('btnNuevaCat').addEventListener('click', () => {
  document.getElementById('modalCategoria').style.display = 'flex';
});
document.getElementById('cancelCat').addEventListener('click', () => {
  document.getElementById('modalCategoria').style.display = 'none';
  document.getElementById('catNombre').value = '';
  document.getElementById('catDescripcion').value = '';
  document.getElementById('catAlert').classList.add('d-none');
});

document.getElementById('submitCat').addEventListener('click', async () => {
  const nombre      = document.getElementById('catNombre').value.trim();
  const descripcion = document.getElementById('catDescripcion').value.trim();
  const alertEl     = document.getElementById('catAlert');
  alertEl.classList.add('d-none');

  if (!nombre) {
    alertEl.textContent = 'El nombre es obligatorio.';
    alertEl.classList.remove('d-none');
    return;
  }

  const btn = document.getElementById('submitCat');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creando...';

  try {
    await apiFetch('/admin/foros/categorias', {
      method: 'POST',
      body: JSON.stringify({ nombre, descripcion }),
    });
    document.getElementById('modalCategoria').style.display = 'none';
    document.getElementById('catNombre').value = '';
    document.getElementById('catDescripcion').value = '';
    cargar();
  } catch (e) {
    alertEl.textContent = e.message ?? 'Error al crear categoría.';
    alertEl.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Crear categoría';
  }
});

cargar();
