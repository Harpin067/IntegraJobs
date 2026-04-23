import { apiFetch } from "../../api.js";
import { requireAuth } from "../../auth.js";

requireAuth();

document.addEventListener('DOMContentLoaded', cargarDashboard);

async function cargarDashboard() {
    try {
        const vacantes = await apiFetch('/empresa/vacantes');

        const container = document.getElementById('vacantesList');
        if (!container) return;

        // Calcular totales para los KPIs
        let totalPostulantes = 0;
        let enProceso        = 0;
        let contratados      = 0;

        vacantes.forEach(v => {
            totalPostulantes += v.total_postulaciones || 0;
            enProceso        += v.en_proceso          || 0;
            contratados      += v.contratados         || 0;
        });

        document.getElementById('totalVacantes').innerText    = vacantes.length;
        document.getElementById('totalPostulantes').innerText = totalPostulantes;
        document.getElementById('enProceso').innerText        = enProceso;
        document.getElementById('contratados').innerText      = contratados;

        if (!vacantes.length) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center py-5 text-muted">
                            <i class="bi bi-file-text fs-1 d-block mb-2 opacity-25"></i>
                            <div class="fw-semibold">Aún no has publicado vacantes</div>
                            <a href="/pages/empresa/crear-vacante.html" class="btn btn-primary btn-sm mt-3">
                                <i class="bi bi-plus-lg me-1"></i> Publicar primera vacante
                            </a>
                        </div>
                    </div>
                </div>`;
            return;
        }

        // Colores de badge según estado
        const BADGE = { activa: 'success', pausada: 'warning', cerrada: 'secondary' };
        const LABEL = { activa: 'Activa',  pausada: 'Pausada',  cerrada: 'Cerrada'  };

        container.innerHTML = vacantes.map(v => {
            const bg    = BADGE[v.status] ?? 'secondary';
            const label = LABEL[v.status] ?? v.status;
            return `
                <div class="col-md-6 col-xl-4">
                    <div class="card border-0 shadow-sm h-100" style="border-radius:12px">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="fw-bold mb-0 me-2 lh-sm">${v.titulo}</h6>
                                <span class="badge bg-${bg} text-capitalize flex-shrink-0">${label}</span>
                            </div>
                            <div class="text-muted small mb-3">
                                <i class="bi bi-geo-alt me-1"></i>${v.ubicacion}
                                <span class="mx-1">·</span>
                                <i class="bi bi-briefcase me-1"></i>${v.tipo_trabajo}
                            </div>

                            <div class="row g-2 mb-3 text-center">
                                <div class="col-4">
                                    <div class="bg-light rounded-3 py-2">
                                        <div class="fw-bold text-primary">${v.total_postulaciones}</div>
                                        <div class="text-muted" style="font-size:.7rem">Postulantes</div>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="bg-light rounded-3 py-2">
                                        <div class="fw-bold text-warning">${v.en_proceso}</div>
                                        <div class="text-muted" style="font-size:.7rem">En proceso</div>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="bg-light rounded-3 py-2">
                                        <div class="fw-bold text-success">${v.contratados}</div>
                                        <div class="text-muted" style="font-size:.7rem">Contratados</div>
                                    </div>
                                </div>
                            </div>

                            <a href="/pages/empresa/aplicaciones.html?vacancy=${v.id}"
                               class="btn btn-outline-primary btn-sm mt-auto">
                                <i class="bi bi-people me-1"></i> Ver candidatos
                            </a>
                        </div>
                    </div>
                </div>`;
        }).join('');

    } catch (error) {
        console.error(error);
        document.getElementById('vacantesList').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>${error.message}</div>
            </div>`;
    }
}
