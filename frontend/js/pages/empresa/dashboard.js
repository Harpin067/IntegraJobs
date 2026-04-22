import { apiFetch } from "../../api.js";
import { requireAuth, logout } from "../../auth.js";

requireAuth();

document.getElementById('logoutBtn').addEventListener('click', e => {
    e.preventDefault();
    logout();
});

document.addEventListener('DOMContentLoaded', cargarDashboard);

async function cargarDashboard() {
    try {
        const vacantes = await apiFetch('/empresa/vacantes');

        const container = document.getElementById('vacantesList');
        if (!container) return;

        let totalPostulantes = 0;
        let enProceso       = 0;
        let contratados     = 0;

        vacantes.forEach(v => {
            totalPostulantes += v.total_postulaciones || 0;
            enProceso        += v.en_proceso          || 0;
            contratados      += v.contratados         || 0;
        });

        document.getElementById('totalVacantes').innerText  = vacantes.length;
        document.getElementById('totalPostulantes').innerText = totalPostulantes;
        document.getElementById('enProceso').innerText      = enProceso;
        document.getElementById('contratados').innerText    = contratados;

        if (!vacantes.length) {
            container.innerHTML = '<p style="color:#6b7280">Aún no has publicado vacantes.</p>';
            return;
        }

        container.innerHTML = vacantes.map(v => `
            <div class="vacante-card">
                <h3>${v.titulo}</h3>
                <p>${v.ubicacion}</p>
                <span class="badge">${v.status}</span>
                <p>👥 ${v.total_postulaciones} postulantes
                   &nbsp;·&nbsp; 🔄 ${v.en_proceso} en proceso
                   &nbsp;·&nbsp; ✅ ${v.contratados} contratados
                </p>
                <button class="btn" onclick="verAplicaciones('${v.id}')">
                    Ver candidatos
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        alert('Error cargando dashboard: ' + error.message);
    }
}

window.verAplicaciones = (id) => {
    window.location.href = `/pages/empresa/aplicaciones.html?vacancy=${id}`;
};
