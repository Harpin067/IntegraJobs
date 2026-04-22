import { apiFetch } from "../../api.js";
import { requireAuth } from "../../auth.js";

requireAuth();

const params = new URLSearchParams(window.location.search);
const vacancyId = params.get('vacancy');

document.addEventListener('DOMContentLoaded', cargar);

const ESTADOS = [
    { value: 'nuevo',     label: 'Nuevo' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'contratado', label: 'Contratado' },
    { value: 'rechazado',  label: 'Rechazado' },
];

function buildSelect(appId, currentStatus) {
    const options = ESTADOS.map(e =>
        `<option value="${e.value}" ${currentStatus === e.value ? 'selected' : ''}>${e.label}</option>`
    ).join('');
    return `<select onchange="estado('${appId}', this.value)">${options}</select>`;
}

async function cargar() {
    if (!vacancyId) {
        document.getElementById('aplicantesList').innerHTML =
            '<p>No se especificó una vacante. <a href="/pages/empresa/vacantes.html">Ir a Mis Vacantes</a></p>';
        return;
    }

    try {
        const data = await apiFetch(`/empresa/vacantes/${vacancyId}/aplicaciones`);
        const container = document.getElementById('aplicantesList');

        if (!data.length) {
            container.innerHTML = '<p>Aún no hay candidatos para esta vacante.</p>';
            return;
        }

        container.innerHTML = data.map(a => `
            <div class="card">
                <h3>${a.nombre} ${a.apellidos}</h3>
                <p>${a.email}</p>
                <p>Teléfono: ${a.telefono || 'N/A'}</p>
                ${a.cv_url
                    ? `<a href="${a.cv_url}" target="_blank" class="cv-link">📄 Ver CV</a>`
                    : `<span class="sin-cv">Sin CV adjunto</span>`
                }
                <div class="estado-row">
                    <label>Estado:</label>
                    ${buildSelect(a.aplicacion_id, a.status)}
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('aplicantesList').innerHTML =
            `<p style="color:red">Error: ${err.message}</p>`;
    }
}

window.estado = async (id, status) => {
    try {
        await apiFetch(`/empresa/aplicaciones/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    } catch (err) {
        alert(`Error al actualizar estado: ${err.message}`);
    }
};
