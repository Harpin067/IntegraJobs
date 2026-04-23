import { apiFetch } from '/js/api.js';

const $ = (id) => document.getElementById(id);

const CAT_ICONS = ['bi-briefcase','bi-mortarboard','bi-lightbulb','bi-handshake','bi-graph-up','bi-globe','bi-lightning','bi-trophy'];
let activeCategoryId = null;
let activeThreadId   = null;

// Cambiar vista activa
function show(view) {
    $('viewCategories').style.display = view === 'categories' ? 'block' : 'none';
    $('viewThreads').style.display    = view === 'threads'    ? 'block' : 'none';
    $('viewThread').style.display     = view === 'thread'     ? 'block' : 'none';
}

function initials(nombre, apellidos) {
    return ((nombre?.[0] ?? '') + (apellidos?.[0] ?? '')).toUpperCase() || '?';
}

function timeAgo(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (d < 60)    return 'hace un momento';
    if (d < 3600)  return `hace ${Math.floor(d / 60)} min`;
    if (d < 86400) return `hace ${Math.floor(d / 3600)} h`;
    return `hace ${Math.floor(d / 86400)} d`;
}

// Cargar categorías
async function cargarCategorias() {
    try {
        const cats = await (await fetch('/api/public/foros')).json();
        const list  = $('categoryList');

        if (!cats.length) {
            list.innerHTML = '<p class="small text-muted text-center py-4">No hay categorías disponibles aún.</p>';
            return;
        }
        list.innerHTML = cats.map((c, i) => `
            <div class="card border-0 shadow-sm mb-3" data-id="${c.id}"
                 style="cursor:pointer;transition:transform .15s,box-shadow .15s;border-radius:12px"
                 onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px -6px rgba(26,86,219,.12)'"
                 onmouseout="this.style.transform='';this.style.boxShadow=''">
                <div class="card-body d-flex align-items-center gap-3 py-3">
                    <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 text-primary"
                         style="width:3rem;height:3rem;background:rgba(13,110,253,.1);font-size:1.25rem">
                        <i class="bi ${CAT_ICONS[i % CAT_ICONS.length]}"></i>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                        <div class="fw-bold">${c.nombre}</div>
                        <div class="text-muted small">${c.descripcion}</div>
                    </div>
                    <div class="text-end flex-shrink-0">
                        <div class="fw-bold text-primary fs-5">${c.total_threads}</div>
                        <div class="text-muted" style="font-size:.75rem">hilos</div>
                    </div>
                </div>
            </div>`
        ).join('');

        list.addEventListener('click', (e) => {
            const card = e.target.closest('[data-id]');
            if (card) cargarHilos(card.dataset.id, cats.find(c => c.id === card.dataset.id)?.nombre ?? 'Categoría');
        });
    } catch {
        $('categoryList').innerHTML = '<p class="small text-danger text-center py-4">Error al cargar categorías.</p>';
    }
}

// Cargar hilos de una categoría
async function cargarHilos(categoryId, categoryName) {
    activeCategoryId = categoryId;
    $('categoryTitle').textContent = categoryName;
    $('threadList').innerHTML = '<p class="small text-muted">Cargando hilos...</p>';
    show('threads');

    try {
        const threads = await (await fetch(`/api/public/foros/${categoryId}/threads`)).json();
        const list    = $('threadList');

        if (!threads.length) {
            list.innerHTML = '<p class="small text-muted text-center py-4">Sé el primero en crear un hilo.</p>';
            return;
        }
        list.innerHTML = threads.map(t => `
            <div class="card border-0 shadow-sm mb-2${t.is_pinned ? ' border-start border-primary border-3' : ''}"
                 data-id="${t.id}"
                 style="cursor:pointer;transition:transform .15s,box-shadow .15s;border-radius:12px"
                 onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px -4px rgba(26,86,219,.1)'"
                 onmouseout="this.style.transform='';this.style.boxShadow=''">
                <div class="card-body d-flex align-items-start gap-3 py-3">
                    <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-primary"
                         style="width:2.25rem;height:2.25rem;background:rgba(13,110,253,.12);font-size:.8125rem">
                        ${initials(t.nombre, t.apellidos)}
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            ${t.is_pinned
                                ? '<span class="badge text-primary px-2" style="background:rgba(13,110,253,.1);font-size:.7rem"><i class="bi bi-pin-angle me-1"></i>Destacado</span>'
                                : ''}
                            <span class="fw-semibold">${t.titulo}</span>
                        </div>
                        <div class="text-muted small mt-1">
                            Por ${t.nombre} ${t.apellidos} · ${timeAgo(t.created_at)}
                        </div>
                    </div>
                    <div class="text-end flex-shrink-0">
                        <div class="fw-semibold text-primary small">${t.total_replies}</div>
                        <div class="text-muted" style="font-size:.75rem">resp.</div>
                    </div>
                </div>
            </div>`
        ).join('');

        list.addEventListener('click', (e) => {
            const card = e.target.closest('[data-id]');
            if (card) cargarThread(card.dataset.id);
        });
    } catch {
        $('threadList').innerHTML = '<p class="small text-danger">Error al cargar hilos.</p>';
    }
}

// Cargar hilo individual con sus respuestas
async function cargarThread(threadId) {
    activeThreadId = threadId;
    $('threadDetail').innerHTML = '<p class="small text-muted">Cargando...</p>';
    show('thread');

    try {
        const t = await (await fetch(`/api/public/foros/threads/${threadId}`)).json();
        $('threadDetail').innerHTML = `
            <div class="card border-0 shadow-sm mb-3" style="border-radius:12px">
                <div class="card-body p-4">
                    <div class="text-muted small mb-2">${t.categoria} · ${timeAgo(t.created_at)}</div>
                    <h5 class="fw-bold mb-3">${t.titulo}</h5>
                    <p style="font-size:.9375rem;line-height:1.7" class="text-dark mb-3">${t.contenido}</p>
                    <div class="text-muted small">Por <strong>${t.autor_nombre} ${t.autor_apellidos}</strong></div>
                </div>
            </div>
            <div class="text-muted small fw-semibold mb-2">
                ${t.replies.length} respuesta${t.replies.length !== 1 ? 's' : ''}
            </div>
            ${t.replies.map(r => `
                <div class="bg-light rounded-3 p-3 mb-2">
                    <div class="text-muted small mb-1">
                        <strong>${r.nombre} ${r.apellidos}</strong> · ${timeAgo(r.created_at)}
                    </div>
                    <div style="font-size:.9rem;line-height:1.65">${r.contenido}</div>
                </div>`).join('')}
        `;
    } catch {
        $('threadDetail').innerHTML = '<p class="small text-danger">Error al cargar el hilo.</p>';
    }
}

// Navegación entre vistas
$('backToCategories').addEventListener('click', () => show('categories'));
$('backToThreads').addEventListener('click', () => {
    show('threads');
    activeThreadId = null;
});

// Abrir/cerrar modal de nuevo hilo
$('btnNuevoThread').addEventListener('click', () => $('modalThread').style.display = 'flex');
$('cancelThread').addEventListener('click',   () => $('modalThread').style.display = 'none');

// Crear nuevo hilo
$('submitThread').addEventListener('click', async () => {
    const titulo    = $('threadTitulo').value.trim();
    const contenido = $('threadContenido').value.trim();
    const alertEl   = $('threadAlert');
    alertEl.classList.add('d-none');

    if (!titulo || !contenido) {
        alertEl.textContent = 'Completa todos los campos.';
        alertEl.classList.remove('d-none');
        return;
    }

    try {
        await apiFetch('/candidato/foros/threads', {
            method: 'POST',
            body: JSON.stringify({ categoryId: activeCategoryId, titulo, contenido }),
        });
        $('modalThread').style.display = 'none';
        $('threadTitulo').value    = '';
        $('threadContenido').value = '';
        cargarHilos(activeCategoryId, $('categoryTitle').textContent);
    } catch (err) {
        alertEl.textContent = err.message ?? 'Error al publicar. Inicia sesión primero.';
        alertEl.classList.remove('d-none');
    }
});

// Enviar respuesta al hilo
$('btnEnviarReply').addEventListener('click', async () => {
    const contenido = $('replyText').value.trim();
    const alertEl   = $('replyAlert');
    alertEl.classList.add('d-none');

    if (!contenido) {
        alertEl.textContent = 'Escribe una respuesta.';
        alertEl.classList.remove('d-none');
        return;
    }

    try {
        await apiFetch(`/candidato/foros/threads/${activeThreadId}/replies`, {
            method: 'POST',
            body: JSON.stringify({ contenido }),
        });
        $('replyText').value = '';
        cargarThread(activeThreadId);
    } catch (err) {
        alertEl.textContent = err.message ?? 'Error al responder. Inicia sesión primero.';
        alertEl.classList.remove('d-none');
    }
});

cargarCategorias();
