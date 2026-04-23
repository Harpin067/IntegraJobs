// busqueda.js — búsqueda y postulación a vacantes
import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

// Redirige si no hay sesión
requireAuth();

document.getElementById('logoutBtn').addEventListener('click', e => {
  e.preventDefault();
  logout();
});

// Referencias al DOM
const resultados = document.getElementById('resultados');
const modalPostularEl = document.getElementById('modalPostular');
const modalPostular = new bootstrap.Modal(modalPostularEl);

// Vacante actualmente seleccionada para postular
let vacanaActual = null;

// Etiquetas de modalidad y contrato
const modalidadLabel = { presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido' };
const contratoLabel  = { completo: 'Tiempo completo', medio: 'Medio tiempo', temporal: 'Temporal', freelance: 'Freelance' };
const expLabel       = { junior: 'Junior', mid: 'Mid', senior: 'Senior', lead: 'Lead' };

// Color del badge según modalidad
const badgeModalidad = { presencial: 'bg-info text-dark', remoto: 'bg-success', hibrido: 'bg-warning text-dark' };

// Escapa caracteres HTML
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Formatea salario si existe
function formatSalario(min, max) {
  if (!min && !max) return '';
  if (min && max) return `$${Number(min).toLocaleString()} – $${Number(max).toLocaleString()}`;
  if (min) return `Desde $${Number(min).toLocaleString()}`;
  return `Hasta $${Number(max).toLocaleString()}`;
}

// Construye la tarjeta de una vacante
function renderCard(v) {
  const salario = formatSalario(v.salario_min, v.salario_max);
  return `
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div style="min-width:0;flex:1">
            <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <h5 class="card-title mb-0 fw-bold">${esc(v.titulo)}</h5>
              <span class="badge ${badgeModalidad[v.tipo_trabajo] ?? 'bg-secondary'}">
                ${modalidadLabel[v.tipo_trabajo] ?? esc(v.tipo_trabajo ?? '')}
              </span>
            </div>
            <p class="text-muted small mb-2">${esc(v.empresa_nombre ?? '')}</p>
            <div class="d-flex gap-3 text-muted small flex-wrap mb-2">
              ${v.ubicacion ? `<span><i class="bi bi-geo-alt me-1"></i>${esc(v.ubicacion)}</span>` : ''}
              ${v.tipo_contrato ? `<span><i class="bi bi-briefcase me-1"></i>${contratoLabel[v.tipo_contrato] ?? esc(v.tipo_contrato)}</span>` : ''}
              ${v.experiencia ? `<span><i class="bi bi-star me-1"></i>${expLabel[v.experiencia] ?? esc(v.experiencia)}</span>` : ''}
            </div>
            <p class="small text-secondary mb-2">${esc((v.descripcion ?? '').slice(0, 220))}${(v.descripcion ?? '').length > 220 ? '...' : ''}</p>
            ${salario ? `<div class="small fw-semibold" style="color:#10b981">${salario}</div>` : ''}
          </div>
          <!-- Botón de postulación -->
          <div class="flex-shrink-0">
            <button class="btn btn-primary btn-sm btn-postular"
              data-vid="${esc(v.id)}"
              data-vtitulo="${esc(v.titulo)}">
              Postularme
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Busca y renderiza vacantes según los filtros
async function buscar() {
  resultados.innerHTML = '<p class="text-muted small">Buscando...</p>';

  const params = new URLSearchParams();
  const fTrabajo  = document.getElementById('fTrabajo').value;
  const fContrato = document.getElementById('fContrato').value;
  const fExp      = document.getElementById('fExp').value;

  if (fTrabajo)  params.set('tipo_trabajo', fTrabajo);
  if (fContrato) params.set('tipo_contrato', fContrato);
  if (fExp)      params.set('experiencia', fExp);
  params.set('limit', '50');

  try {
    const resp = await apiFetch(`/vacantes?${params}`);
    let items = resp?.data ?? [];

    // Filtro de texto en el cliente
    const q = document.getElementById('q').value.trim().toLowerCase();
    if (q) {
      items = items.filter(v =>
        (v.titulo ?? '').toLowerCase().includes(q) ||
        (v.empresa_nombre ?? '').toLowerCase().includes(q) ||
        (v.descripcion ?? '').toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      resultados.innerHTML = `
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <i class="bi bi-search fs-2 text-muted d-block mb-2"></i>
            <p class="text-muted small">No se encontraron vacantes con esos filtros.</p>
          </div>
        </div>`;
      return;
    }

    resultados.innerHTML = items.map(renderCard).join('');
  } catch (err) {
    resultados.innerHTML = '<div class="alert alert-danger small">Error al cargar vacantes. Intenta de nuevo.</div>';
    console.error(err);
  }
}

// Buscar al hacer click en el botón
document.getElementById('btnBuscar').addEventListener('click', buscar);

// Buscar al presionar Enter en el input
document.getElementById('q').addEventListener('keydown', e => {
  if (e.key === 'Enter') buscar();
});

// Abrir modal al hacer click en "Postularme"
resultados.addEventListener('click', e => {
  const btn = e.target.closest('.btn-postular');
  if (!btn) return;
  vacanaActual = { id: btn.dataset.vid, titulo: btn.dataset.vtitulo };
  document.getElementById('modalPostularLabel').textContent = `Postular a: ${vacanaActual.titulo}`;
  document.getElementById('pmMensaje').value = '';
  document.getElementById('postularAlert').classList.add('d-none');
  modalPostular.show();
});

// Enviar postulación
document.getElementById('btnEnviarPostulacion').addEventListener('click', async () => {
  if (!vacanaActual) return;

  const btn = document.getElementById('btnEnviarPostulacion');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    await apiFetch(`/candidato/postulaciones/${vacanaActual.id}`, {
      method: 'POST',
      body: JSON.stringify({ mensaje: document.getElementById('pmMensaje').value.trim() || undefined }),
    });
    modalPostular.hide();
    // Mostramos un mensaje simple usando alert nativo — suficiente para esta vista
    alert('¡Postulación enviada correctamente!');
  } catch (err) {
    const alertEl = document.getElementById('postularAlert');
    alertEl.textContent = err.message ?? 'Error al enviar la postulación.';
    alertEl.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar postulación';
  }
});

// Carga inicial
buscar();
