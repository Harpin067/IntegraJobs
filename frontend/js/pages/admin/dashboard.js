import { apiFetch } from '/js/api.js';
import { requireAuth } from '/js/auth.js';

const user = requireAuth();
if (!user || user.role !== 'SUPERADMIN') {
  window.location.href = '/pages/login.html';
  throw new Error('Unauthorized');
}

// ── Helpers ───────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const MODALIDAD  = { presencial:'Presencial', remoto:'Remoto', hibrido:'Híbrido' };
const CONTRATO   = { completo:'Tiempo completo', medio:'Medio tiempo', temporal:'Temporal', freelance:'Freelance' };
const EXPERIENCIA = { junior:'Junior (0–2 años)', mid:'Mid (2–5 años)', senior:'Senior (5+ años)', lead:'Lead / Manager' };

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('es-SV', { day:'2-digit', month:'short', year:'numeric' }) : '—';
}

function initials(name) {
  return (name ?? '').split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

// ── Modal de detalle de vacante ───────────────────────────
let modalInstance = null;
let _currentVacId = null;

function openVacancyModal(v) {
  _currentVacId = v.id;

  document.getElementById('mvTitulo').textContent   = v.titulo;
  document.getElementById('mvEmpresa').textContent  = v.empresa_nombre ?? '';
  document.getElementById('mvUbicacion').textContent = v.ubicacion;
  document.getElementById('mvContacto').textContent  = v.contacto;
  document.getElementById('mvModalidad').textContent = MODALIDAD[v.tipo_trabajo] ?? v.tipo_trabajo;
  document.getElementById('mvContrato').textContent  = CONTRATO[v.tipo_contrato] ?? v.tipo_contrato;
  document.getElementById('mvExperiencia').textContent = EXPERIENCIA[v.experiencia] ?? v.experiencia;
  document.getElementById('mvDescripcion').textContent = v.descripcion;
  document.getElementById('mvRequisitos').textContent  = v.requisitos;
  document.getElementById('mvFecha').textContent = `Publicada el ${fmt(v.created_at)}`;

  // Salario
  const salWrap = document.getElementById('mvSalarioWrap');
  const salEl   = document.getElementById('mvSalario');
  if (v.salario_min || v.salario_max) {
    salWrap.style.display = '';
    const min = v.salario_min ? `$${Number(v.salario_min).toLocaleString()}` : '';
    const max = v.salario_max ? `$${Number(v.salario_max).toLocaleString()}` : '';
    salEl.textContent = min && max ? `${min} – ${max} USD/mes` : (min || max) + ' USD/mes';
  } else {
    salWrap.style.display = 'none';
  }

  // Badges
  const badgesEl = document.getElementById('mvBadges');
  badgesEl.innerHTML = `
    <span class="badge px-2 py-1" style="background:#fef3c7;color:#92400e">${MODALIDAD[v.tipo_trabajo] ?? v.tipo_trabajo}</span>
    <span class="badge px-2 py-1" style="background:#e0e7ff;color:#3730a3">${CONTRATO[v.tipo_contrato] ?? v.tipo_contrato}</span>
    <span class="badge px-2 py-1" style="background:#d1fae5;color:#065f46">${EXPERIENCIA[v.experiencia] ?? v.experiencia}</span>
    <span class="badge px-2 py-1" style="background:#fee2e2;color:#991b1b">Pendiente de aprobación</span>`;

  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(document.getElementById('modalVacante'));
  }
  modalInstance.show();
}

async function accionVacante(aprobar) {
  if (!_currentVacId) return;

  const btn = aprobar
    ? document.getElementById('mvBtnAprobar')
    : document.getElementById('mvBtnRechazar');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

  try {
    await apiFetch(`/admin/vacantes/${_currentVacId}/aprobar`, {
      method: 'PATCH',
      body: JSON.stringify({ aprobar }),
    });
    modalInstance.hide();
    await cargar();
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = aprobar
      ? '<i class="bi bi-check-lg me-1"></i> Aprobar Vacante'
      : '<i class="bi bi-x-lg me-1"></i> Rechazar';
  }
}

document.getElementById('mvBtnAprobar').addEventListener('click', () => accionVacante(true));
document.getElementById('mvBtnRechazar').addEventListener('click', () => accionVacante(false));

// ── Carga de datos ────────────────────────────────────────
async function cargar() {
  try {
    const [usuarios, empresasPend, vacantes, vacActivas] = await Promise.all([
      apiFetch('/admin/usuarios'),
      apiFetch('/admin/empresas/pendientes'),
      apiFetch('/admin/vacantes/pendientes'),
      apiFetch('/vacantes?limit=500').catch(() => ({ data: [] })),
    ]);

    document.getElementById('kpiUsuarios').textContent = usuarios.length;
    document.getElementById('kpiEmpPend').textContent  = empresasPend.length;
    document.getElementById('kpiVacPend').textContent  = vacantes.length;
    document.getElementById('kpiVacAct').textContent   = vacActivas?.data?.length ?? 0;

    renderEmpresas(empresasPend);
    renderVacantes(vacantes);
  } catch (err) {
    console.error(err);
  }
}

// ── Render empresas pendientes ────────────────────────────
function renderEmpresas(empresas) {
  const ct = document.getElementById('empresasList');

  if (!empresas.length) {
    ct.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-check-circle fs-1 d-block mb-2 opacity-25 text-success"></i>
        <div class="small">No hay empresas pendientes.</div>
      </div>`;
    return;
  }

  ct.innerHTML = empresas.map(c => `
    <div class="d-flex align-items-center gap-3 px-3 py-3" style="border-bottom:1px solid #f1f5f9">
      <div class="rounded-3 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
           style="width:42px;height:42px;background:linear-gradient(135deg,#1e40af,#1e3a8a);font-size:.85rem">
        ${esc(initials(c.nombre))}
      </div>
      <div class="flex-grow-1 min-width-0">
        <div class="fw-semibold small text-truncate">${esc(c.nombre)}</div>
        <div class="text-muted" style="font-size:.72rem">${esc(c.user_email ?? '')} · ${esc(c.industria ?? '')}</div>
        <div class="text-muted" style="font-size:.72rem"><i class="bi bi-geo-alt me-1"></i>${esc(c.ubicacion ?? '')}</div>
      </div>
      <button class="btn btn-sm btn-primary flex-shrink-0" data-verify="${esc(c.id)}">
        <i class="bi bi-check-lg"></i> Verificar
      </button>
    </div>
  `).join('');

  ct.querySelectorAll('[data-verify]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
      try {
        await apiFetch(`/admin/empresas/${btn.dataset.verify}/verificar`, {
          method: 'PATCH',
          body: JSON.stringify({ verificar: true }),
        });
        await cargar();
      } catch (e) {
        alert('Error: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Verificar';
      }
    });
  });
}

// ── Render vacantes pendientes ────────────────────────────
function renderVacantes(vacantes) {
  const ct = document.getElementById('vacantesList');

  if (!vacantes.length) {
    ct.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-check-circle fs-1 d-block mb-2 opacity-25 text-success"></i>
        <div class="small">No hay vacantes pendientes.</div>
      </div>`;
    return;
  }

  ct.innerHTML = vacantes.map(v => `
    <div class="d-flex align-items-start gap-3 px-3 py-3" style="border-bottom:1px solid #f1f5f9">
      <div class="flex-grow-1 min-width-0">
        <div class="fw-semibold small text-truncate">${esc(v.titulo)}</div>
        <div class="text-muted" style="font-size:.72rem">
          <i class="bi bi-building me-1"></i>${esc(v.empresa_nombre ?? '')}
          · <i class="bi bi-geo-alt me-1"></i>${esc(v.ubicacion)}
          · ${MODALIDAD[v.tipo_trabajo] ?? v.tipo_trabajo}
        </div>
        <div class="text-muted" style="font-size:.72rem">
          ${CONTRATO[v.tipo_contrato] ?? v.tipo_contrato}
          · ${EXPERIENCIA[v.experiencia] ?? v.experiencia}
          · Publicada ${fmt(v.created_at)}
        </div>
      </div>
      <div class="d-flex gap-2 flex-shrink-0">
        <button class="btn btn-outline-primary btn-sm" data-detail='${JSON.stringify(v).replace(/'/g,"&#39;")}'>
          <i class="bi bi-eye me-1"></i>Ver
        </button>
      </div>
    </div>
  `).join('');

  ct.querySelectorAll('[data-detail]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = JSON.parse(btn.dataset.detail);
      openVacancyModal(v);
    });
  });
}

// ── Gráficas ──────────────────────────────────────────────
const STATUS_COLORS = {
  activa:    { bg: 'rgba(16,185,129,.75)',  border: '#059669' },
  pausada:   { bg: 'rgba(245,158,11,.75)',  border: '#d97706' },
  cerrada:   { bg: 'rgba(107,114,128,.75)', border: '#4b5563' },
  rechazada: { bg: 'rgba(239,68,68,.75)',   border: '#dc2626' },
};
const ROL_COLORS = {
  CANDIDATO:  { bg: 'rgba(26,86,219,.75)',  border: '#1e40af' },
  EMPRESA:    { bg: 'rgba(16,185,129,.75)', border: '#059669' },
  SUPERADMIN: { bg: 'rgba(139,92,246,.75)', border: '#7c3aed' },
};

let chartVacantes = null;
let chartUsuarios = null;

async function cargarCharts() {
  try {
    const stats = await apiFetch('/admin/stats/charts');

    // Vacantes por estado — Doughnut
    const vLabels  = stats.vacantesPorEstado.map(r => r.status);
    const vData    = stats.vacantesPorEstado.map(r => r.total);
    const vColors  = vLabels.map(s => (STATUS_COLORS[s] ?? { bg: '#e5e7eb' }).bg);
    const vBorders = vLabels.map(s => (STATUS_COLORS[s] ?? { border: '#9ca3af' }).border);

    if (chartVacantes) chartVacantes.destroy();
    chartVacantes = new Chart(document.getElementById('chartVacantes'), {
      type: 'doughnut',
      data: {
        labels: vLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        datasets: [{ data: vData, backgroundColor: vColors, borderColor: vBorders, borderWidth: 2 }],
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } } },
        cutout: '60%',
        maintainAspectRatio: true,
      },
    });

    // Usuarios por rol — Bar horizontal
    const uLabels  = stats.usuariosPorRol.map(r => r.role);
    const uData    = stats.usuariosPorRol.map(r => r.total);
    const uColors  = uLabels.map(r => (ROL_COLORS[r] ?? { bg: '#e5e7eb' }).bg);
    const uBorders = uLabels.map(r => (ROL_COLORS[r] ?? { border: '#9ca3af' }).border);

    if (chartUsuarios) chartUsuarios.destroy();
    chartUsuarios = new Chart(document.getElementById('chartUsuarios'), {
      type: 'bar',
      data: {
        labels: uLabels,
        datasets: [{
          label: 'Usuarios',
          data: uData,
          backgroundColor: uColors,
          borderColor: uBorders,
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: '#f1f5f9' } },
          y: { grid: { display: false } },
        },
        maintainAspectRatio: true,
      },
    });
  } catch (err) {
    console.error('Error cargando charts:', err);
  }
}

cargar();
cargarCharts();
