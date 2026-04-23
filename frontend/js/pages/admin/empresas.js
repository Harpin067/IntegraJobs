import { apiFetch } from '/js/api.js';
import { requireAuth } from '/js/auth.js';

const user = requireAuth();
if (!user || user.role !== 'SUPERADMIN') {
  window.location.href = '/pages/login.html';
  throw new Error('Unauthorized');
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('es-SV', { day:'2-digit', month:'short', year:'numeric' }) : '—';
}

function initials(name) {
  return (name ?? '').split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

let allEmpresas = [];
let modalInstance = null;
let _currentEmpId = null;
let _currentVerif  = false;

// ── Modal de empresa ──────────────────────────────────────
function openModal(e) {
  _currentEmpId = e.id;
  _currentVerif  = e.is_verified;

  // Header
  document.getElementById('meNombre').textContent   = e.nombre;
  document.getElementById('meIndustria').textContent = e.industria ?? '';

  // Logo
  const logoImg = document.getElementById('meLogoImg');
  const logoIni = document.getElementById('meLogoIni');
  if (e.logo_url) {
    logoImg.src = e.logo_url;
    logoImg.style.display = 'block';
    logoIni.style.display = 'none';
  } else {
    logoImg.style.display = 'none';
    logoIni.textContent   = initials(e.nombre);
    logoIni.style.display = '';
  }

  // Info
  document.getElementById('meEmail').textContent      = e.user_email ?? '—';
  document.getElementById('meUbicacion').textContent  = e.ubicacion ?? '—';
  document.getElementById('meFecha').textContent      = fmt(e.created_at);
  document.getElementById('meDescripcion').textContent = e.descripcion ?? '—';

  const sitioEl = document.getElementById('meSitio');
  if (e.sitio_web) {
    sitioEl.innerHTML = `<a href="${esc(e.sitio_web)}" target="_blank" rel="noopener">${esc(e.sitio_web)}</a>`;
  } else {
    sitioEl.textContent = '—';
  }

  // Stats
  document.getElementById('meVacantes').textContent    = e.total_vacantes ?? 0;
  document.getElementById('meValoraciones').textContent = e.total_valoraciones ?? 0;
  document.getElementById('meRating').textContent       = e.rating_promedio ? `${e.rating_promedio} ★` : '—';

  // Badges
  document.getElementById('meBadges').innerHTML = e.is_verified
    ? `<span class="badge px-2 py-1" style="background:#d1fae5;color:#065f46"><i class="bi bi-patch-check-fill me-1"></i>Verificada</span>`
    : `<span class="badge px-2 py-1" style="background:#fef3c7;color:#92400e"><i class="bi bi-hourglass-split me-1"></i>Pendiente de verificación</span>`;

  if (!e.user_activo) {
    document.getElementById('meBadges').innerHTML +=
      `<span class="badge px-2 py-1" style="background:#fee2e2;color:#991b1b">Usuario inactivo</span>`;
  }

  // Botones footer
  const btnVerif  = document.getElementById('meBtnVerificar');
  const btnRevocar = document.getElementById('meBtnRevocar');
  btnVerif.style.display  = e.is_verified ? 'none' : '';
  btnRevocar.style.display = e.is_verified ? '' : 'none';

  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(document.getElementById('modalEmpresa'));
  }
  modalInstance.show();
}

async function accionEmpresa(verificar) {
  const btn = verificar
    ? document.getElementById('meBtnVerificar')
    : document.getElementById('meBtnRevocar');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

  try {
    await apiFetch(`/admin/empresas/${_currentEmpId}/verificar`, {
      method: 'PATCH',
      body: JSON.stringify({ verificar }),
    });
    modalInstance.hide();
    await load();
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = verificar
      ? '<i class="bi bi-patch-check me-1"></i> Verificar empresa'
      : '<i class="bi bi-x-circle me-1"></i> Revocar verificación';
  }
}

document.getElementById('meBtnVerificar').addEventListener('click', () => accionEmpresa(true));
document.getElementById('meBtnRevocar').addEventListener('click',   () => accionEmpresa(false));

// ── Render ────────────────────────────────────────────────
function render() {
  const q      = document.getElementById('q').value.trim().toLowerCase();
  const estado = document.getElementById('fEstado').value;
  const orden  = document.getElementById('fOrden').value;

  let items = allEmpresas.filter(e => {
    if (estado === 'verificada' && !e.is_verified)  return false;
    if (estado === 'pendiente'  &&  e.is_verified)  return false;
    if (q) {
      const hay = `${e.nombre ?? ''} ${e.industria ?? ''} ${e.user_email ?? ''} ${e.ubicacion ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (orden === 'nombre') {
    items.sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));
  } else if (orden === 'vacantes') {
    items.sort((a, b) => (b.total_vacantes ?? 0) - (a.total_vacantes ?? 0));
  }

  document.getElementById('countBadge').textContent = items.length;

  const ct = document.getElementById('empresasList');

  if (!items.length) {
    ct.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-search fs-1 d-block mb-2 opacity-25"></i>
        <div class="small">Sin resultados para los filtros aplicados.</div>
      </div>`;
    return;
  }

  ct.innerHTML = items.map(e => `
    <div class="d-flex align-items-center gap-3 px-4 py-3" style="border-bottom:1px solid #f1f5f9">

      <!-- Logo / Iniciales -->
      <div class="rounded-3 overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center"
           style="width:46px;height:46px;background:${e.logo_url ? '#f8fafc' : 'linear-gradient(135deg,#1e40af,#1e3a8a)'};border:1px solid #e2e8f0">
        ${e.logo_url
          ? `<img src="${esc(e.logo_url)}" alt="" style="width:100%;height:100%;object-fit:contain">`
          : `<span class="fw-bold text-white" style="font-size:.85rem">${esc(initials(e.nombre))}</span>`
        }
      </div>

      <!-- Info -->
      <div class="flex-grow-1 min-width-0">
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="fw-semibold small">${esc(e.nombre)}</span>
          ${e.is_verified
            ? `<span class="badge px-1 py-0" style="background:#d1fae5;color:#065f46;font-size:.65rem"><i class="bi bi-patch-check-fill"></i> Verificada</span>`
            : `<span class="badge px-1 py-0" style="background:#fef3c7;color:#92400e;font-size:.65rem">Pendiente</span>`
          }
        </div>
        <div class="text-muted" style="font-size:.72rem">
          <i class="bi bi-tag me-1"></i>${esc(e.industria ?? '—')}
          · <i class="bi bi-geo-alt me-1"></i>${esc(e.ubicacion ?? '—')}
          · <i class="bi bi-envelope me-1"></i>${esc(e.user_email ?? '—')}
        </div>
        <div class="text-muted mt-1" style="font-size:.72rem">
          <i class="bi bi-briefcase me-1"></i>${e.total_vacantes ?? 0} vacantes
          · <i class="bi bi-star me-1"></i>${e.total_valoraciones ?? 0} valoraciones
          ${e.rating_promedio ? `· ${e.rating_promedio} ★` : ''}
          · Registrada ${fmt(e.created_at)}
        </div>
      </div>

      <!-- Acción -->
      <button class="btn btn-outline-primary btn-sm flex-shrink-0"
              data-emp='${JSON.stringify(e).replace(/'/g,"&#39;")}'>
        <i class="bi bi-eye me-1"></i> Ver detalle
      </button>
    </div>
  `).join('');

  ct.querySelectorAll('[data-emp]').forEach(btn => {
    btn.addEventListener('click', () => {
      const empresa = JSON.parse(btn.dataset.emp);
      openModal(empresa);
    });
  });
}

async function load() {
  try {
    allEmpresas = await apiFetch('/admin/empresas');

    const total    = allEmpresas.length;
    const verif    = allEmpresas.filter(e => e.is_verified).length;
    const vacTotal = allEmpresas.reduce((acc, e) => acc + (e.total_vacantes ?? 0), 0);

    document.getElementById('kpiTotal').textContent    = total;
    document.getElementById('kpiVerif').textContent    = verif;
    document.getElementById('kpiPend').textContent     = total - verif;
    document.getElementById('kpiVacantes').textContent = vacTotal;

    render();
  } catch (err) {
    document.getElementById('empresasList').innerHTML = `
      <div class="alert alert-danger m-3">Error al cargar empresas: ${esc(err.message)}</div>`;
  }
}

document.getElementById('q').addEventListener('input', render);
document.getElementById('fEstado').addEventListener('change', render);
document.getElementById('fOrden').addEventListener('change', render);

load();
