// frontend/js/pages/candidato/vacante.js
import { apiFetch } from '/js/api.js';
import { requireAuth } from '/js/auth.js';

requireAuth();

const id = new URLSearchParams(location.search).get('id');

const modalidadLabel = { presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido' };
const contratoLabel  = { completo: 'Tiempo completo', medio: 'Medio tiempo', temporal: 'Temporal', freelance: 'Freelance' };
const expLabel       = { junior: 'Junior', mid: 'Mid', senior: 'Senior', lead: 'Lead' };
const badgeModalidad = { presencial: 'bg-info text-dark', remoto: 'bg-success', hibrido: 'bg-warning text-dark' };

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatSalario(min, max) {
  if (!min && !max) return null;
  if (min && max) return `$${Number(min).toLocaleString()} – $${Number(max).toLocaleString()}`;
  if (min) return `Desde $${Number(min).toLocaleString()}`;
  return `Hasta $${Number(max).toLocaleString()}`;
}

function showError(msg) {
  document.getElementById('mainContent').innerHTML = `
    <div class="card border-0 shadow-sm p-5 text-center">
      <i class="bi bi-emoji-frown fs-1 text-muted d-block mb-3"></i>
      <p class="fw-semibold mb-3">${esc(msg)}</p>
      <a href="/pages/candidato/busqueda.html" class="btn btn-primary btn-sm mx-auto" style="width:fit-content">
        ← Ver empleos
      </a>
    </div>`;
}

if (!id) {
  showError('No se especificó una vacante.');
} else {
  cargar(id);
}

async function cargar(vacanteId) {
  try {
    const v = await apiFetch(`/vacantes/${encodeURIComponent(vacanteId)}`);
    renderDetalle(v);
  } catch (err) {
    showError(err.status === 404
      ? 'Esta vacante no existe o ya no está disponible.'
      : 'Error al cargar la vacante. Intenta más tarde.');
  }
}

function renderDetalle(v) {
  document.getElementById('breadcrumbTitulo').textContent = v.titulo;
  document.title = `${v.titulo} — IntegraJobs`;

  const salario = formatSalario(v.salario_min, v.salario_max);

  document.getElementById('mainContent').innerHTML = `
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body p-4">

        <!-- Cabecera -->
        <div class="d-flex align-items-start gap-3 mb-4">
          ${v.empresa_logo
            ? `<img src="${esc(v.empresa_logo)}" alt="${esc(v.empresa_nombre)}"
                    style="width:56px;height:56px;border-radius:10px;object-fit:contain;border:1px solid #e2e8f0;flex-shrink:0"
                    onerror="this.style.display='none'">`
            : `<div style="width:56px;height:56px;border-radius:10px;background:#eff6ff;color:#1e40af;font-weight:700;font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                 ${esc((v.empresa_nombre ?? 'E').charAt(0).toUpperCase())}
               </div>`
          }
          <div>
            <h1 class="h4 fw-bold mb-1">${esc(v.titulo)}</h1>
            <div class="text-muted small">
              <strong class="text-dark">${esc(v.empresa_nombre ?? '')}</strong>
              ${v.ubicacion ? ` &nbsp;·&nbsp; ${esc(v.ubicacion)}` : ''}
            </div>
          </div>
        </div>

        <!-- Badges -->
        <div class="d-flex flex-wrap gap-2 mb-4">
          <span class="badge ${badgeModalidad[v.tipo_trabajo] ?? 'bg-secondary'}">
            ${modalidadLabel[v.tipo_trabajo] ?? esc(v.tipo_trabajo ?? '')}
          </span>
          <span class="badge bg-light text-dark border">${contratoLabel[v.tipo_contrato] ?? esc(v.tipo_contrato ?? '')}</span>
          <span class="badge bg-light text-dark border">${expLabel[v.experiencia] ?? esc(v.experiencia ?? '')}</span>
          ${salario ? `<span class="badge" style="background:#d1fae5;color:#065f46">${esc(salario)}</span>` : ''}
        </div>

        <!-- Descripción -->
        <h6 class="fw-bold mb-2">Descripción del puesto</h6>
        <p class="text-secondary mb-4" style="line-height:1.75;white-space:pre-line">${esc(v.descripcion ?? '')}</p>

        <!-- Requisitos -->
        <h6 class="fw-bold mb-2">Requisitos</h6>
        <p class="text-secondary mb-4" style="line-height:1.75;white-space:pre-line">${esc(v.requisitos ?? '')}</p>

        <hr class="my-4">

        <!-- Acción de postulación -->
        <div id="postulacionZona">
          <button class="btn btn-primary px-4" id="btnPostular">
            <i class="bi bi-send me-2"></i>Postularme a esta vacante
          </button>
          <div id="postularMsg" class="mt-2"></div>
        </div>

      </div>
    </div>

    <!-- Info empresa -->
    ${v.empresa_descripcion || v.empresa_ubicacion || v.empresa_industria ? `
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <div class="text-uppercase text-muted fw-semibold mb-3" style="font-size:.7rem;letter-spacing:.06em">Sobre la empresa</div>
        <div class="d-flex align-items-center gap-3 mb-3">
          ${v.empresa_logo
            ? `<img src="${esc(v.empresa_logo)}" style="width:40px;height:40px;border-radius:8px;object-fit:contain;border:1px solid #e2e8f0" onerror="this.style.display='none'">`
            : ''}
          <div>
            <div class="fw-semibold">${esc(v.empresa_nombre ?? '')}</div>
            ${v.empresa_verificada ? `<span class="badge bg-success" style="font-size:.65rem">✓ Verificada</span>` : ''}
          </div>
        </div>
        ${v.empresa_descripcion ? `<p class="text-muted small mb-3" style="line-height:1.6">${esc(v.empresa_descripcion)}</p>` : ''}
        <div class="text-muted small d-flex flex-column gap-1">
          ${v.empresa_ubicacion ? `<span><i class="bi bi-geo-alt me-1"></i>${esc(v.empresa_ubicacion)}</span>` : ''}
          ${v.empresa_industria ? `<span><i class="bi bi-building me-1"></i>${esc(v.empresa_industria)}</span>` : ''}
          ${v.empresa_sitio     ? `<a href="${esc(v.empresa_sitio)}" target="_blank" rel="noopener" class="text-decoration-none" style="color:#1e40af"><i class="bi bi-globe me-1"></i>Sitio web</a>` : ''}
        </div>
      </div>
    </div>` : ''}
  `;

  setupPostulacion(v.id);
}

function setupPostulacion(vacanteId) {
  const btn    = document.getElementById('btnPostular');
  const msgEl  = document.getElementById('postularMsg');

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Postulando...';
    msgEl.innerHTML = '';

    try {
      await apiFetch(`/candidato/postulaciones/${encodeURIComponent(vacanteId)}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      btn.classList.replace('btn-primary', 'btn-success');
      btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>¡Te has postulado!';
      btn.disabled = true;
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send me-2"></i>Postularme a esta vacante';
      msgEl.innerHTML = `<div class="text-danger small">${esc(err.message ?? 'Error al postular. Intenta de nuevo.')}</div>`;
    }
  });
}
