import { apiFetch } from "../../api.js";
import { requireAuth } from "../../auth.js";

requireAuth();

const params    = new URLSearchParams(window.location.search);
const vacancyId = params.get('vacancy');

document.addEventListener('DOMContentLoaded', cargar);

// Opciones de estado para el select
const ESTADOS = [
    { value: 'nuevo',      label: 'Nuevo' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'contratado', label: 'Contratado' },
    { value: 'rechazado',  label: 'Rechazado' },
];

// Color del badge según estado
const BADGE_COLOR = {
    nuevo:      'primary',
    en_proceso: 'warning',
    contratado: 'success',
    rechazado:  'danger',
};

function buildSelect(appId, currentStatus) {
    const options = ESTADOS.map(e =>
        `<option value="${e.value}" ${currentStatus === e.value ? 'selected' : ''}>${e.label}</option>`
    ).join('');
    return `<select class="form-select form-select-sm status-select" style="width:auto"
                    onchange="cambiarEstado('${appId}', this.value)">${options}</select>`;
}

function buildCvHtml(cvUrl) {
    if (!cvUrl || cvUrl === 'sin-cv') {
        return '<span class="text-muted small fst-italic">Sin CV adjunto</span>';
    }
    if (cvUrl.startsWith('/uploads/')) {
        return `
            <button onclick="abrirPDF('${cvUrl}')" class="btn btn-outline-secondary btn-sm me-1">
                <i class="bi bi-eye"></i> Ver PDF
            </button>
            <a href="${cvUrl}" download class="btn btn-outline-success btn-sm">
                <i class="bi bi-download"></i> Descargar
            </a>`;
    }
    return `<a href="${cvUrl}" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">
                <i class="bi bi-box-arrow-up-right"></i> Ver CV externo
            </a>`;
}

function buildAvatarHtml(app) {
    if (app.avatar_url) {
        return `<img src="${app.avatar_url}" alt="Foto" class="avatar-circle">`;
    }
    const iniciales = (app.nombre?.[0] ?? '') + (app.apellidos?.[0] ?? '');
    return `<div class="avatar-ph text-secondary fw-bold">${iniciales || '?'}</div>`;
}

async function cargar() {
    const subtitle  = document.getElementById('vacancySubtitle');
    const container = document.getElementById('aplicantesList');

    if (!vacancyId) {
        container.innerHTML = `
            <div class="alert alert-warning">
                No se especificó ninguna vacante.
                <a href="/pages/empresa/vacantes.html" class="alert-link">Ir a Mis Vacantes</a>
            </div>`;
        return;
    }

    try {
        const data = await apiFetch(`/empresa/vacantes/${vacancyId}/aplicaciones`);

        if (subtitle) {
            subtitle.textContent = `${data.length} candidato${data.length !== 1 ? 's' : ''} registrado${data.length !== 1 ? 's' : ''}`;
        }

        if (!data.length) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center py-5 text-muted">
                        <i class="bi bi-people fs-1 d-block mb-2 opacity-25"></i>
                        <div class="fw-semibold">Aún no hay candidatos</div>
                        <div class="small">Los postulantes aparecerán aquí cuando apliquen a esta vacante.</div>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = data.map(a => `
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        ${buildAvatarHtml(a)}
                        <div class="flex-grow-1">
                            <div class="fw-bold">${a.nombre} ${a.apellidos}</div>
                            <div class="text-muted small">${a.email}</div>
                        </div>
                        <span class="badge bg-${BADGE_COLOR[a.status] || 'secondary'} text-uppercase" style="font-size:.7rem">
                            ${ESTADOS.find(e => e.value === a.status)?.label ?? a.status}
                        </span>
                    </div>

                    <div class="small text-muted mb-2">
                        <i class="bi bi-telephone me-1"></i> ${a.telefono || 'Sin teléfono'}
                    </div>

                    <div class="mb-3">
                        ${buildCvHtml(a.cv_url)}
                    </div>

                    <hr class="my-2">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <label class="form-label small fw-semibold mb-0">Estado:</label>
                        ${buildSelect(a.aplicacion_id, a.status)}
                        ${a.status !== 'contratado'
                            ? `<button class="btn btn-success btn-sm ms-auto"
                                       onclick="aceptarCandidato('${a.aplicacion_id}', this)">
                                   <i class="bi bi-check-lg me-1"></i> Aceptar
                               </button>`
                            : `<span class="ms-auto badge bg-success px-3 py-2" style="font-size:.85rem">
                                   <i class="bi bi-check-circle me-1"></i> Contratado
                               </span>`
                        }
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle me-2"></i> Error al cargar candidatos: ${err.message}
            </div>`;
    }
}

// Aceptar candidato (contratar directamente)
window.aceptarCandidato = async (id, btn) => {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        await apiFetch(`/empresa/aplicaciones/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'contratado' })
        });

        // Actualizar badge y select sin recargar la página
        const cardBody = btn.closest('.card-body');
        const badge    = cardBody?.querySelector('.badge');
        const select   = cardBody?.querySelector(`select[onchange*="'${id}'"]`);

        if (badge) {
            badge.className   = `badge bg-${BADGE_COLOR['contratado']} text-uppercase`;
            badge.style.fontSize = '.7rem';
            badge.textContent = 'Contratado';
        }
        if (select) select.value = 'contratado';

        btn.replaceWith(Object.assign(document.createElement('span'), {
            className: 'ms-auto badge bg-success px-3 py-2',
            innerHTML: '<i class="bi bi-check-circle me-1"></i> Contratado',
            style:     'font-size:.85rem',
        }));
    } catch (err) {
        alert('Error al contratar: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Aceptar';
    }
};

// Cambiar estado de la postulación
window.cambiarEstado = async (id, status) => {
    try {
        await apiFetch(`/empresa/aplicaciones/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        // Actualizar el badge sin recargar toda la lista
        document.querySelectorAll(`select[onchange*="'${id}'"]`).forEach(sel => {
            const card  = sel.closest('.card-body');
            const badge = card?.querySelector('.badge');
            if (badge) {
                badge.className = `badge bg-${BADGE_COLOR[status] || 'secondary'} text-uppercase`;
                badge.style.fontSize = '.7rem';
                badge.textContent    = ESTADOS.find(e => e.value === status)?.label ?? status;
            }
        });
    } catch (err) {
        alert('Error al actualizar el estado: ' + err.message);
    }
};

// Visor de PDF (modal personalizado)
window.abrirPDF = (url) => {
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
