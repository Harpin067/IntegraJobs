const grid      = document.getElementById('resourceGrid');
const emptyMsg  = document.getElementById('emptyMsg');
const filterBar = document.getElementById('filterBar');

// Colores de los badges por tipo de recurso
const BADGE_STYLE = {
    articulo: 'background:#dbeafe;color:#1e40af',
    tutorial: 'background:#d1fae5;color:#065f46',
    video:    'background:#fce7f3;color:#9d174d',
};
const LABEL = { articulo: 'Artículo', tutorial: 'Tutorial', video: 'Video' };


function renderCard(r) {
    const badgeStyle = BADGE_STYLE[r.tipo] ?? 'background:#e9ecef;color:#374151';
    const label      = LABEL[r.tipo] ?? r.tipo;
    const fecha      = new Date(r.created_at).toLocaleDateString('es-SV', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    const url = r.url || r.imagen_url || r.imagenUrl || null;

    return `
        <div class="col">
            <div class="card border-0 shadow-sm h-100 resource-card-hover"
                 style="border-radius:12px;overflow:hidden">
                ${r.imagen_url
                    ? `<img src="${r.imagen_url}" alt="${r.titulo}" class="card-img-top"
                            style="height:180px;object-fit:cover" loading="lazy"
                            onerror="this.style.display='none'">`
                    : ''
                }
                <div class="card-body d-flex flex-column">
                    <span class="badge mb-2 align-self-start"
                          style="${badgeStyle};font-size:.75rem;font-weight:600">${label}</span>
                    <h6 class="card-title fw-bold">${r.titulo}</h6>
                    <p class="card-text text-muted small flex-grow-1"
                       style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
                        ${r.contenido}
                    </p>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.75rem">
                        <span class="text-muted" style="font-size:.75rem">${fecha}</span>
                        <a href="${url ?? '#'}"
                           ${url ? 'target="_blank" rel="noopener noreferrer"' : ''}
                           style="font-size:.75rem;font-weight:600;color:${url ? '#1e40af' : '#9ca3af'};text-decoration:none"
                           onmouseover="this.style.color='${url ? '#1e3a8a' : '#9ca3af'}'"
                           onmouseout="this.style.color='${url ? '#1e40af' : '#9ca3af'}'">
                            Ver recurso →
                        </a>
                    </div>
                </div>
            </div>
        </div>`;
}

async function cargar(tipo) {
    // Mostrar skeletons mientras carga
    grid.innerHTML = [1, 2, 3].map((_, i) =>
        `<div class="col"><div class="skeleton" style="height:260px;animation-delay:${i * 0.15}s"></div></div>`
    ).join('');
    emptyMsg.classList.add('d-none');

    try {
        const qs  = tipo ? `?tipo=${tipo}` : '';
        const res = await fetch(`/api/public/recursos${qs}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (!data.length) {
            grid.innerHTML = '';
            emptyMsg.textContent = 'No hay recursos publicados aún en esta categoría.';
            emptyMsg.classList.remove('d-none');
            return;
        }
        grid.innerHTML = data.map(renderCard).join('');
    } catch {
        grid.innerHTML = '';
        emptyMsg.textContent = 'Error al cargar los recursos. Intenta más tarde.';
        emptyMsg.classList.remove('d-none');
    }
}

// Filtro de tipo: toggle Bootstrap btn classes
filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tipo]');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline-secondary');
    });
    btn.classList.remove('btn-outline-secondary');
    btn.classList.add('btn-primary');
    cargar(btn.dataset.tipo);
});

cargar('');
