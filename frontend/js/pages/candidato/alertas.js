import { apiFetch } from '/js/api.js';
import { requireAuth } from '/js/auth.js';

requireAuth();

const success = document.getElementById('successMsg');
const error   = document.getElementById('errorMsg');

function flash(el, msg) {
    el.textContent = msg;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 3500);
}

const MODALIDAD = { presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido' };

async function cargarAlertas() {
    const container = document.getElementById('alertasList');
    try {
        const alertas = await apiFetch('/candidato/alertas');
        if (!alertas.length) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-bell fs-1 d-block mb-2 opacity-25"></i>
                    <div class="small">No tienes alertas configuradas. Crea una arriba para recibir notificaciones.</div>
                </div>`;
            return;
        }
        container.innerHTML = alertas.map(a => `
            <div class="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div class="d-flex align-items-center gap-3">
                    <div class="rounded-circle d-flex align-items-center justify-content-center"
                         style="width:2rem;height:2rem;background:${a.is_active ? 'rgba(16,185,129,.1)' : '#f3f4f6'};
                                color:${a.is_active ? '#10b981' : '#9ca3af'};font-size:.875rem">
                        <i class="bi bi-bell${a.is_active ? '' : '-slash'}"></i>
                    </div>
                    <div>
                        <div class="fw-semibold small">${a.keyword}</div>
                        <div class="text-muted" style="font-size:.75rem">
                            ${[a.ubicacion, MODALIDAD[a.tipo_trabajo]].filter(Boolean).join(' · ') || 'Sin filtros adicionales'}
                        </div>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button onclick="toggleAlerta('${a.id}', ${a.is_active})"
                            class="btn btn-outline-secondary btn-sm ${a.is_active ? '' : 'opacity-75'}">
                        ${a.is_active ? 'Pausar' : 'Activar'}
                    </button>
                    <button onclick="eliminarAlerta('${a.id}')"
                            class="btn btn-outline-danger btn-sm">
                        Eliminar
                    </button>
                </div>
            </div>`
        ).join('');
    } catch {
        container.innerHTML = '<div class="alert alert-danger small">Error al cargar alertas.</div>';
    }
}

document.getElementById('alertaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const keyword     = document.getElementById('aKeyword').value.trim();
        const ubicacion   = document.getElementById('aUbicacion').value.trim();
        const tipoTrabajo = document.getElementById('aTipoTrabajo').value;
        await apiFetch('/candidato/alertas', {
            method: 'POST',
            body: JSON.stringify({ keyword, ubicacion: ubicacion || undefined, tipoTrabajo: tipoTrabajo || undefined }),
        });
        document.getElementById('aKeyword').value     = '';
        document.getElementById('aUbicacion').value   = '';
        document.getElementById('aTipoTrabajo').value = '';
        flash(success, 'Alerta creada correctamente.');
        cargarAlertas();
    } catch (err) {
        flash(error, err.message ?? 'Error al crear alerta.');
    }
});

window.toggleAlerta = async (id, wasActive) => {
    try {
        await apiFetch(`/candidato/alertas/${id}/toggle`, { method: 'PATCH' });
        flash(success, wasActive ? 'Alerta pausada.' : 'Alerta activada.');
        cargarAlertas();
    } catch (err) { flash(error, err.message ?? 'Error.'); }
};

window.eliminarAlerta = async (id) => {
    if (!confirm('¿Eliminar esta alerta?')) return;
    try {
        await apiFetch(`/candidato/alertas/${id}`, { method: 'DELETE' });
        flash(success, 'Alerta eliminada.');
        cargarAlertas();
    } catch (err) { flash(error, err.message ?? 'Error.'); }
};

cargarAlertas();
