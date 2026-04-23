import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

requireAuth();
document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });

const CAT_ICONS = [
  'bi-briefcase','bi-mortarboard','bi-lightbulb','bi-handshake',
  'bi-graph-up','bi-globe','bi-lightning','bi-trophy',
];
const CAT_COLORS = [
  '#e0e7ff:#1e40af','#d1fae5:#065f46','#fef3c7:#92400e','#fce7f3:#9d174d',
  '#e0f2fe:#0c4a6e','#f0fdf4:#14532d','#f5f3ff:#4c1d95','#fff7ed:#7c2d12',
];

let activeCategoryId   = null;
let activeCategoryName = '';
let activeThreadId     = null;

function show(view) {
  document.getElementById('viewCategories').style.display = view === 'categories' ? 'block' : 'none';
  document.getElementById('viewThreads').style.display    = view === 'threads'    ? 'block' : 'none';
  document.getElementById('viewThread').style.display     = view === 'thread'     ? 'block' : 'none';
}

function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60)    return 'hace un momento';
  if (d < 3600)  return `hace ${Math.floor(d / 60)} min`;
  if (d < 86400) return `hace ${Math.floor(d / 3600)} h`;
  return `hace ${Math.floor(d / 86400)} d`;
}

function initials(nombre, apellidos) {
  return ((nombre?.[0] ?? '') + (apellidos?.[0] ?? '')).toUpperCase() || '?';
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// ── Categorías ───────────────────────────────────────────────────────────
async function cargarCategorias() {
  try {
    const cats = await (await fetch('/api/public/foros')).json();
    const list = document.getElementById('categoryList');

    if (!cats.length) {
      list.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <i class="bi bi-chat-square-text fs-1 d-block mb-2 opacity-25"></i>
          <div class="small">No hay categorías disponibles aún.</div>
        </div>`;
      return;
    }

    list.innerHTML = cats.map((c, i) => {
      const [bg, color] = (CAT_COLORS[i % CAT_COLORS.length]).split(':');
      return `
        <div class="col-md-6">
          <div class="card border-0 shadow-sm forum-card h-100" data-id="${esc(c.id)}" data-nombre="${esc(c.nombre)}">
            <div class="card-body d-flex align-items-center gap-3 py-3">
              <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                   style="width:3rem;height:3rem;background:${bg};color:${color};font-size:1.25rem">
                <i class="bi ${CAT_ICONS[i % CAT_ICONS.length]}"></i>
              </div>
              <div class="flex-grow-1 min-w-0">
                <div class="fw-bold text-truncate">${esc(c.nombre)}</div>
                <div class="text-muted small text-truncate">${esc(c.descripcion)}</div>
              </div>
              <div class="text-end flex-shrink-0">
                <div class="fw-bold" style="color:#1e40af;font-size:1.1rem">${c.total_threads}</div>
                <div class="text-muted" style="font-size:.72rem">hilos</div>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('[data-id]').forEach(card => {
      card.addEventListener('click', () =>
        cargarHilos(card.dataset.id, card.dataset.nombre)
      );
    });
  } catch {
    document.getElementById('categoryList').innerHTML =
      `<div class="col-12"><div class="alert alert-danger small">Error al cargar categorías.</div></div>`;
  }
}

// ── Hilos ─────────────────────────────────────────────────────────────────
async function cargarHilos(categoryId, categoryName) {
  activeCategoryId   = categoryId;
  activeCategoryName = categoryName;
  document.getElementById('categoryTitle').textContent = categoryName;
  document.getElementById('modalCategoryName').textContent = `· ${categoryName}`;
  document.getElementById('threadList').innerHTML =
    `<div class="text-center text-muted py-4">
       <div class="spinner-border spinner-border-sm mb-2" role="status"></div>
       <div class="small">Cargando hilos...</div>
     </div>`;
  show('threads');

  try {
    const threads = await (await fetch(`/api/public/foros/${categoryId}/threads`)).json();
    const list = document.getElementById('threadList');

    if (!threads.length) {
      list.innerHTML = `
        <div class="text-center text-muted py-5">
          <i class="bi bi-chat-left-text fs-1 d-block mb-2 opacity-25"></i>
          <p class="small mb-3">Sé el primero en crear un hilo en esta categoría.</p>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('btnNuevoThread').click()">
            <i class="bi bi-plus-lg me-1"></i> Crear primer hilo
          </button>
        </div>`;
      return;
    }

    list.innerHTML = threads.map(t => `
      <div class="card border-0 shadow-sm mb-3 thread-card${t.is_pinned ? ' border-start border-primary border-3' : ''}"
           data-id="${esc(t.id)}">
        <div class="card-body d-flex align-items-start gap-3 py-3">
          <div class="avatar-circle flex-shrink-0" style="background:#e0e7ff;color:#1e40af">
            ${esc(initials(t.nombre, t.apellidos))}
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              ${t.is_pinned
                ? `<span class="badge px-2 py-1" style="background:#e0e7ff;color:#1e40af;font-size:.68rem">
                     <i class="bi bi-pin-angle me-1"></i>Destacado
                   </span>`
                : ''}
              <span class="fw-semibold">${esc(t.titulo)}</span>
            </div>
            <div class="text-muted small">
              Por <strong>${esc(t.nombre)} ${esc(t.apellidos)}</strong>
              &nbsp;·&nbsp; ${timeAgo(t.created_at)}
            </div>
          </div>
          <div class="text-end flex-shrink-0">
            <div class="fw-semibold" style="color:#1e40af">${t.total_replies}</div>
            <div class="text-muted" style="font-size:.72rem">resp.</div>
          </div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-id]').forEach(card => {
      card.addEventListener('click', () => cargarThread(card.dataset.id));
    });
  } catch {
    document.getElementById('threadList').innerHTML =
      `<div class="alert alert-danger small">Error al cargar hilos.</div>`;
  }
}

// ── Hilo individual ───────────────────────────────────────────────────────
async function cargarThread(threadId) {
  activeThreadId = threadId;
  document.getElementById('threadDetail').innerHTML =
    `<div class="text-center text-muted py-4">
       <div class="spinner-border spinner-border-sm mb-2" role="status"></div>
       <div class="small">Cargando hilo...</div>
     </div>`;
  show('thread');

  try {
    const t = await (await fetch(`/api/public/foros/threads/${threadId}`)).json();

    document.getElementById('threadDetail').innerHTML = `
      <div class="card border-0 shadow-sm mb-4" style="border-radius:12px;overflow:hidden">
        <div class="section-header" style="border-radius:0;padding:.75rem 1.25rem">
          <div class="d-flex align-items-center gap-2 text-white-50 small mb-1">
            <i class="bi bi-folder me-1"></i>${esc(t.categoria)}
            &nbsp;·&nbsp; ${timeAgo(t.created_at)}
          </div>
          <h5 class="fw-bold mb-0 text-white">${esc(t.titulo)}</h5>
        </div>
        <div class="card-body p-4">
          <p style="line-height:1.75;white-space:pre-line;color:var(--bs-body-color)" class="mb-3">
            ${esc(t.contenido)}
          </p>
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-circle" style="background:#e0e7ff;color:#1e40af;width:2rem;height:2rem;font-size:.75rem">
              ${esc(initials(t.autor_nombre, t.autor_apellidos))}
            </div>
            <span class="small text-muted">
              Por <strong class="text-body">${esc(t.autor_nombre)} ${esc(t.autor_apellidos)}</strong>
            </span>
          </div>
        </div>
      </div>

      ${t.replies.length
        ? `<div class="text-muted small fw-semibold mb-3">
             <i class="bi bi-chat-left-text me-1"></i>
             ${t.replies.length} respuesta${t.replies.length !== 1 ? 's' : ''}
           </div>
           ${t.replies.map(r => `
             <div class="reply-box p-3 mb-3">
               <div class="d-flex align-items-center gap-2 mb-2">
                 <div class="avatar-circle" style="background:#d1fae5;color:#065f46;width:2rem;height:2rem;font-size:.75rem">
                   ${esc(initials(r.nombre, r.apellidos))}
                 </div>
                 <div>
                   <div class="fw-semibold small">${esc(r.nombre)} ${esc(r.apellidos)}</div>
                   <div class="text-muted" style="font-size:.72rem">${timeAgo(r.created_at)}</div>
                 </div>
               </div>
               <p class="small mb-0" style="line-height:1.65;white-space:pre-line">${esc(r.contenido)}</p>
             </div>`).join('')}`
        : `<div class="text-center text-muted py-3 small">
             <i class="bi bi-chat-left-text d-block fs-4 mb-1 opacity-25"></i>
             Sé el primero en responder este hilo.
           </div>`
      }
    `;
  } catch {
    document.getElementById('threadDetail').innerHTML =
      `<div class="alert alert-danger small">Error al cargar el hilo.</div>`;
  }
}

// ── Navegación ────────────────────────────────────────────────────────────
document.getElementById('backToCategories').addEventListener('click', () => {
  activeCategoryId = null;
  show('categories');
});
document.getElementById('backToThreads').addEventListener('click', () => {
  activeThreadId = null;
  document.getElementById('replyText').value = '';
  document.getElementById('replyAlert').classList.add('d-none');
  show('threads');
});

// ── Modal nuevo hilo ──────────────────────────────────────────────────────
document.getElementById('btnNuevoThread').addEventListener('click', () => {
  document.getElementById('modalThread').style.display = 'flex';
});
document.getElementById('cancelThread').addEventListener('click', () => {
  document.getElementById('modalThread').style.display = 'none';
  document.getElementById('threadTitulo').value = '';
  document.getElementById('threadContenido').value = '';
  document.getElementById('threadAlert').classList.add('d-none');
});

document.getElementById('submitThread').addEventListener('click', async () => {
  const titulo    = document.getElementById('threadTitulo').value.trim();
  const contenido = document.getElementById('threadContenido').value.trim();
  const alertEl   = document.getElementById('threadAlert');
  alertEl.classList.add('d-none');

  if (!titulo || !contenido) {
    alertEl.textContent = 'Completa el título y el contenido.';
    alertEl.classList.remove('d-none');
    return;
  }

  const btn = document.getElementById('submitThread');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Publicando...';

  try {
    await apiFetch('/candidato/foros/threads', {
      method: 'POST',
      body: JSON.stringify({ categoryId: activeCategoryId, titulo, contenido }),
    });
    document.getElementById('modalThread').style.display = 'none';
    document.getElementById('threadTitulo').value = '';
    document.getElementById('threadContenido').value = '';
    cargarHilos(activeCategoryId, activeCategoryName);
  } catch (err) {
    alertEl.textContent = err.message ?? 'Error al publicar. Verifica tu sesión.';
    alertEl.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-send me-1"></i> Publicar hilo';
  }
});

// ── Enviar respuesta ──────────────────────────────────────────────────────
document.getElementById('btnEnviarReply').addEventListener('click', async () => {
  const contenido = document.getElementById('replyText').value.trim();
  const alertEl   = document.getElementById('replyAlert');
  alertEl.classList.add('d-none');

  if (!contenido) {
    alertEl.textContent = 'Escribe una respuesta antes de enviar.';
    alertEl.classList.remove('d-none');
    return;
  }

  const btn = document.getElementById('btnEnviarReply');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Enviando...';

  try {
    await apiFetch(`/candidato/foros/threads/${activeThreadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ contenido }),
    });
    document.getElementById('replyText').value = '';
    cargarThread(activeThreadId);
  } catch (err) {
    alertEl.textContent = err.message ?? 'Error al responder. Verifica tu sesión.';
    alertEl.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-send me-1"></i> Publicar respuesta';
  }
});

cargarCategorias();
