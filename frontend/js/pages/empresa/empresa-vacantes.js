const token = localStorage.getItem('token');
if (!token) window.location.href = '/pages/login.html';

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// Colores de badge para estado de vacante y candidato
const BADGE_VACANTE   = { activa: 'success', pausada: 'warning', cerrada: 'secondary' };
const BADGE_CANDIDATO = { nuevo: 'primary', en_proceso: 'warning', contratado: 'success', rechazado: 'danger' };
const LABEL_CANDIDATO = { nuevo: 'Nuevo', en_proceso: 'En Proceso', contratado: 'Contratado', rechazado: 'Rechazado' };

/* ─── CV ──────────────────────────────────────────────────── */

function buildCvButton(cvUrl) {
    if (!cvUrl || cvUrl === 'sin-cv') {
        return '<span class="text-muted small fst-italic">Sin CV adjunto</span>';
    }
    if (cvUrl.startsWith('/uploads/')) {
        return `
            <button onclick="abrirVisorPDF('${cvUrl}')" class="btn btn-outline-secondary btn-sm me-1">
                <i class="bi bi-eye"></i> Ver PDF
            </button>
            <a href="${cvUrl}" download class="btn btn-outline-success btn-sm">
                <i class="bi bi-download"></i> Descargar
            </a>`;
    }
    return `
        <a href="${cvUrl}" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-box-arrow-up-right"></i> Ver CV externo
        </a>`;
}

// Visor PDF en modal personalizado (igual que aplicaciones.js)
window.abrirVisorPDF = (url) => {
    const existente = document.getElementById('_pdfModal');
    if (existente) existente.remove();

    const overlay = document.createElement('div');
    overlay.id        = '_pdfModal';
    overlay.className = 'pdf-overlay';
    overlay.innerHTML = `
        <div class="pdf-box">
            <div class="pdf-header">
                <span class="fw-bold"><i class="bi bi-file-earmark-pdf text-danger me-2"></i>Currículum Vitae</span>
                <div class="d-flex gap-2">
                    <a href="${url}" download class="btn btn-outline-success btn-sm">
                        <i class="bi bi-download"></i> Descargar
                    </a>
                    <button onclick="document.getElementById('_pdfModal').remove()"
                            class="btn btn-danger btn-sm">
                        <i class="bi bi-x-lg"></i> Cerrar
                    </button>
                </div>
            </div>
            <iframe src="${url}" style="flex:1;border:none;width:100%" title="CV del candidato"></iframe>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
};

let vacancyEnEdicion = null;
let vacantesCache    = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarVacantes();
    document.getElementById('vacantesList').addEventListener('click', manejarClickVacante);
    document.getElementById('editForm').addEventListener('submit', guardarEdicion);
    document.getElementById('cancelEdit').addEventListener('click', cerrarEdicion);
});

/* ─── LISTAR VACANTES ────────────────────────────────────── */

async function cargarVacantes() {
    try {
        const res     = await fetch('/api/empresa/vacantes', { headers });
        vacantesCache = await res.json();

        const container = document.getElementById('vacantesList');
        container.innerHTML = '';

        if (!vacantesCache.length) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center py-5 text-muted">
                        <i class="bi bi-file-text fs-1 d-block mb-2 opacity-25"></i>
                        <div class="fw-semibold">No has publicado vacantes aún</div>
                        <a href="/pages/empresa/crear-vacante.html" class="btn btn-primary btn-sm mt-3">
                            Publicar ahora
                        </a>
                    </div>
                </div>`;
            return;
        }

        vacantesCache.forEach(v => {
            const bg    = BADGE_VACANTE[v.status] ?? 'secondary';
            const label = v.status.charAt(0).toUpperCase() + v.status.slice(1);

            const div = document.createElement('div');
            div.className = 'card border-0 shadow-sm mb-3';
            div.style.borderRadius = '12px';
            div.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div class="fw-bold me-2">${v.titulo}</div>
                        <span class="badge bg-${bg} flex-shrink-0">${label}</span>
                    </div>
                    <div class="text-muted small mb-3">
                        <i class="bi bi-geo-alt me-1"></i>${v.ubicacion}
                        <span class="mx-1">·</span>${v.tipo_trabajo}
                    </div>

                    <div class="d-flex gap-3 small mb-3">
                        <span class="text-primary fw-semibold">
                            <i class="bi bi-people me-1"></i>${v.total_postulaciones} postulantes
                        </span>
                        <span class="text-warning fw-semibold">
                            <i class="bi bi-arrow-repeat me-1"></i>${v.en_proceso} en proceso
                        </span>
                        <span class="text-success fw-semibold">
                            <i class="bi bi-check-circle me-1"></i>${v.contratados} contratados
                        </span>
                    </div>

                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-primary btn-sm"
                                data-action="candidatos" data-id="${v.id}"
                                data-titulo="${encodeURIComponent(v.titulo)}">
                            <i class="bi bi-people me-1"></i> Ver Candidatos
                        </button>
                        <button class="btn btn-outline-secondary btn-sm"
                                data-action="editar" data-id="${v.id}">
                            <i class="bi bi-pencil me-1"></i> Editar
                        </button>
                        ${v.status === 'activa'
                            ? `<button class="btn btn-outline-warning btn-sm"
                                       data-action="status" data-id="${v.id}" data-status="pausada">
                                   <i class="bi bi-pause-circle me-1"></i> Pausar
                               </button>`
                            : v.status === 'pausada'
                                ? `<button class="btn btn-outline-success btn-sm"
                                           data-action="status" data-id="${v.id}" data-status="activa">
                                       <i class="bi bi-play-circle me-1"></i> Activar
                                   </button>`
                                : ''
                        }
                        ${v.status !== 'cerrada'
                            ? `<button class="btn btn-outline-danger btn-sm"
                                       data-action="status" data-id="${v.id}" data-status="cerrada">
                                   <i class="bi bi-x-circle me-1"></i> Cerrar
                               </button>`
                            : ''
                        }
                    </div>
                </div>`;
            container.appendChild(div);
        });

    } catch (err) {
        console.error('Error cargando vacantes:', err);
    }
}

function manejarClickVacante(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id, titulo, status } = btn.dataset;
    if (action === 'candidatos') cargarATS(id, decodeURIComponent(titulo));
    if (action === 'editar')     abrirEdicion(id);
    if (action === 'status')     cambiarEstado(id, status);
}

/* ─── VER CANDIDATOS (ATS inline) ───────────────────────── */

async function cargarATS(vacancyId, titulo) {
    cerrarEdicion();
    document.getElementById('atsTitle').innerText = `Candidatos: ${titulo}`;

    const container = document.getElementById('aplicantesContainer');
    container.innerHTML = `
        <div class="text-center text-muted py-4">
            <div class="spinner-border spinner-border-sm mb-2" role="status"></div>
            <div class="small">Cargando candidatos...</div>
        </div>`;

    try {
        const res         = await fetch(`/api/empresa/vacantes/${vacancyId}/aplicaciones`, { headers });
        const aplicaciones = await res.json();

        if (!aplicaciones.length) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center py-5 text-muted">
                        <i class="bi bi-people fs-1 d-block mb-2 opacity-25"></i>
                        <div class="small">Aún no hay candidatos para esta vacante.</div>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = '';
        aplicaciones.forEach(app => {
            const cvHtml     = buildCvButton(app.cv_url);
            const iniciales  = (app.nombre?.[0] ?? '') + (app.apellidos?.[0] ?? '');
            const avatarHtml = app.avatar_url
                ? `<img src="${app.avatar_url}" alt="Foto" class="avatar-circle">`
                : `<div class="avatar-ph text-secondary fw-bold">${iniciales || '?'}</div>`;
            const badgeBg    = BADGE_CANDIDATO[app.status] ?? 'secondary';
            const badgeLabel = LABEL_CANDIDATO[app.status] ?? app.status;

            const div = document.createElement('div');
            div.className = 'card border-0 shadow-sm mb-3';
            div.style.borderRadius = '12px';
            div.innerHTML = `
                <div class="card-body">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        ${avatarHtml}
                        <div class="flex-grow-1">
                            <div class="fw-bold">${app.nombre} ${app.apellidos}</div>
                            <a href="mailto:${app.email}" class="text-primary text-decoration-none small">${app.email}</a>
                        </div>
                        <span class="badge bg-${badgeBg} text-uppercase flex-shrink-0" style="font-size:.7rem">
                            ${badgeLabel}
                        </span>
                    </div>

                    <div class="small text-muted mb-2">
                        <i class="bi bi-telephone me-1"></i>${app.telefono || 'Sin teléfono'}
                    </div>

                    <div class="mb-3">${cvHtml}</div>

                    <hr class="my-2">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <label class="form-label small fw-semibold mb-0">Estado:</label>
                        <select class="form-select form-select-sm status-select"
                                data-app-id="${app.aplicacion_id}" style="width:auto">
                            <option value="nuevo"      ${app.status === 'nuevo'      ? 'selected' : ''}>Nuevo</option>
                            <option value="en_proceso" ${app.status === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
                            <option value="contratado" ${app.status === 'contratado' ? 'selected' : ''}>Contratado</option>
                            <option value="rechazado"  ${app.status === 'rechazado'  ? 'selected' : ''}>Rechazado</option>
                        </select>
                        ${app.status !== 'contratado'
                            ? `<button class="btn btn-success btn-sm ms-auto"
                                       onclick="aceptarCandidato('${app.aplicacion_id}', this)">
                                   <i class="bi bi-check-lg me-1"></i> Aceptar
                               </button>`
                            : `<span class="ms-auto badge bg-success fs-6 px-3 py-2">
                                   <i class="bi bi-check-circle me-1"></i> Contratado
                               </span>`
                        }
                    </div>
                </div>`;
            container.appendChild(div);
        });

        // Actualizar estado al cambiar el select
        container.addEventListener('change', async e => {
            const sel = e.target.closest('select[data-app-id]');
            if (!sel) return;
            await cambiarStatusCandidato(sel.dataset.appId, sel.value, sel);
        });

    } catch (err) {
        container.innerHTML = `
            <div class="alert alert-danger small">
                <i class="bi bi-exclamation-circle me-1"></i> Error al cargar candidatos.
            </div>`;
    }
}

// Botón rápido para contratar al candidato
window.aceptarCandidato = async (appId, btn) => {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    const res = await fetch(`/api/empresa/aplicaciones/${appId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'contratado' }),
    });

    if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error al contratar');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Aceptar';
        return;
    }

    // Actualizar badge y select; reemplazar botón por badge verde
    const cardBody = btn.closest('.card-body');
    const badge    = cardBody?.querySelector('.badge');
    const select   = cardBody?.querySelector('select[data-app-id]');

    if (badge) {
        badge.className   = 'badge bg-success text-uppercase flex-shrink-0';
        badge.style.fontSize = '.7rem';
        badge.textContent = 'Contratado';
    }
    if (select) select.value = 'contratado';

    btn.replaceWith(Object.assign(document.createElement('span'), {
        className: 'ms-auto badge bg-success fs-6 px-3 py-2',
        innerHTML: '<i class="bi bi-check-circle me-1"></i> Contratado',
    }));
};

async function cambiarStatusCandidato(appId, nuevoStatus, selEl) {
    const res = await fetch(`/api/empresa/aplicaciones/${appId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nuevoStatus })
    });
    if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error al actualizar el estado');
        return;
    }
    // Actualizar el badge del candidato sin recargar
    const card  = selEl.closest('.card-body');
    const badge = card?.querySelector('.badge');
    if (badge) {
        badge.className = `badge bg-${BADGE_CANDIDATO[nuevoStatus] ?? 'secondary'} text-uppercase flex-shrink-0`;
        badge.style.fontSize = '.7rem';
        badge.textContent    = LABEL_CANDIDATO[nuevoStatus] ?? nuevoStatus;
    }
}

/* ─── CAMBIAR ESTADO DE VACANTE ──────────────────────────── */

async function cambiarEstado(vacancyId, nuevoStatus) {
    const res = await fetch(`/api/empresa/vacantes/${vacancyId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: nuevoStatus })
    });
    if (res.ok) {
        cargarVacantes();
    } else {
        const err = await res.json();
        alert(err.error || 'Error al cambiar el estado');
    }
}

/* ─── EDICIÓN INLINE ─────────────────────────────────────── */

function abrirEdicion(vacancyId) {
    const v = vacantesCache.find(x => x.id === vacancyId);
    if (!v) return;
    vacancyEnEdicion = v;

    document.getElementById('e_titulo').value       = v.titulo        || '';
    document.getElementById('e_ubicacion').value    = v.ubicacion     || '';
    document.getElementById('e_descripcion').value  = v.descripcion   || '';
    document.getElementById('e_requisitos').value   = v.requisitos    || '';
    document.getElementById('e_tipoTrabajo').value  = v.tipo_trabajo  || 'remoto';
    document.getElementById('e_tipoContrato').value = v.tipo_contrato || 'completo';
    document.getElementById('e_experiencia').value  = v.experiencia   || 'junior';
    document.getElementById('e_contacto').value     = v.contacto      || '';
    document.getElementById('e_salarioMin').value   = v.salario_min   || '';
    document.getElementById('e_salarioMax').value   = v.salario_max   || '';
    document.getElementById('editMsg').innerText    = '';

    document.getElementById('candidatosPanel').style.display = 'none';
    document.getElementById('editPanel').style.display       = 'block';
}

function cerrarEdicion() {
    vacancyEnEdicion = null;
    document.getElementById('editPanel').style.display       = 'none';
    document.getElementById('candidatosPanel').style.display = 'block';
}

async function guardarEdicion(e) {
    e.preventDefault();
    if (!vacancyEnEdicion) return;

    const msg    = document.getElementById('editMsg');
    const salMin = document.getElementById('e_salarioMin').value.trim();
    const salMax = document.getElementById('e_salarioMax').value.trim();

    const body = {
        titulo:       document.getElementById('e_titulo').value,
        ubicacion:    document.getElementById('e_ubicacion').value,
        descripcion:  document.getElementById('e_descripcion').value,
        requisitos:   document.getElementById('e_requisitos').value,
        tipoTrabajo:  document.getElementById('e_tipoTrabajo').value,
        tipoContrato: document.getElementById('e_tipoContrato').value,
        experiencia:  document.getElementById('e_experiencia').value,
        contacto:     document.getElementById('e_contacto').value,
        ...(salMin && { salarioMin: salMin }),
        ...(salMax && { salarioMax: salMax }),
    };

    const res = await fetch(`/api/empresa/vacantes/${vacancyEnEdicion.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });

    if (res.ok) {
        msg.className = 'small fw-semibold text-success';
        msg.innerText = 'Vacante actualizada';
        setTimeout(() => { cerrarEdicion(); cargarVacantes(); }, 900);
    } else {
        const err = await res.json();
        msg.className = 'small fw-semibold text-danger';
        msg.innerText = err.error || 'Error al actualizar';
    }
}
