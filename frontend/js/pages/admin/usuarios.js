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

function initials(nombre, apellidos) {
  const n = (nombre ?? '')[0] ?? '';
  const a = (apellidos ?? '')[0] ?? '';
  return (n + a).toUpperCase() || '?';
}

const ROLE_BADGE = {
  CANDIDATO:  { bg: '#dbeafe', color: '#1e40af', label: 'Candidato' },
  EMPRESA:    { bg: '#d1fae5', color: '#065f46', label: 'Empresa' },
  SUPERADMIN: { bg: '#ede9fe', color: '#5b21b6', label: 'Admin' },
};

let allUsers = [];

function render() {
  const q       = document.getElementById('q').value.trim().toLowerCase();
  const role    = document.getElementById('fRole').value;
  const estado  = document.getElementById('fEstado').value;

  const items = allUsers.filter(u => {
    if (role   && u.role !== role) return false;
    if (estado === 'activo'   && !u.is_active)  return false;
    if (estado === 'inactivo' &&  u.is_active)  return false;
    if (q) {
      const hay = `${u.nombre ?? ''} ${u.apellidos ?? ''} ${u.email ?? ''} ${u.empresa_nombre ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  document.getElementById('countBadge').textContent = items.length;

  const ct = document.getElementById('usuariosList');

  if (!items.length) {
    ct.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-search fs-1 d-block mb-2 opacity-25"></i>
        <div class="small">Sin resultados para los filtros aplicados.</div>
      </div>`;
    return;
  }

  ct.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead style="background:#f8fafc">
          <tr>
            <th class="ps-4 py-3 small fw-semibold text-muted text-uppercase border-0">Usuario</th>
            <th class="py-3 small fw-semibold text-muted text-uppercase border-0">Rol</th>
            <th class="py-3 small fw-semibold text-muted text-uppercase border-0">Empresa</th>
            <th class="py-3 small fw-semibold text-muted text-uppercase border-0">Estado</th>
            <th class="py-3 small fw-semibold text-muted text-uppercase border-0">Alta</th>
            <th class="pe-4 py-3 small fw-semibold text-muted text-uppercase border-0 text-end">Acción</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(u => {
            const badge  = ROLE_BADGE[u.role] ?? ROLE_BADGE.CANDIDATO;
            const nombre = `${u.nombre ?? ''} ${u.apellidos ?? ''}`.trim() || '—';
            return `
            <tr>
              <td class="ps-4">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                       style="width:38px;height:38px;background:linear-gradient(135deg,#1e40af,#1e3a8a);font-size:.8rem">
                    ${esc(initials(u.nombre, u.apellidos))}
                  </div>
                  <div>
                    <div class="fw-semibold small">${esc(nombre)}</div>
                    <div class="text-muted" style="font-size:.72rem">${esc(u.email ?? '')}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge px-2 py-1" style="background:${badge.bg};color:${badge.color};font-size:.72rem">
                  ${badge.label}
                </span>
              </td>
              <td class="small text-muted">${esc(u.empresa_nombre ?? '—')}</td>
              <td>
                ${u.is_active
                  ? `<span class="badge px-2 py-1" style="background:#d1fae5;color:#065f46;font-size:.72rem"><i class="bi bi-circle-fill me-1" style="font-size:.4rem"></i>Activo</span>`
                  : `<span class="badge px-2 py-1" style="background:#fee2e2;color:#991b1b;font-size:.72rem"><i class="bi bi-circle-fill me-1" style="font-size:.4rem"></i>Inactivo</span>`
                }
              </td>
              <td class="small text-muted">${fmt(u.created_at)}</td>
              <td class="pe-4 text-end">
                ${u.role === 'SUPERADMIN'
                  ? `<span class="text-muted small">—</span>`
                  : `<button class="btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}"
                             data-toggle="${esc(u.id)}">
                       <i class="bi bi-${u.is_active ? 'slash-circle' : 'check-circle'} me-1"></i>
                       ${u.is_active ? 'Desactivar' : 'Activar'}
                     </button>`
                }
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  ct.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
      try {
        await apiFetch(`/admin/usuarios/${btn.dataset.toggle}/toggle`, { method: 'PATCH' });
        await load();
      } catch (e) {
        alert('Error: ' + e.message);
        btn.disabled = false;
      }
    });
  });
}

async function load() {
  try {
    allUsers = await apiFetch('/admin/usuarios');
    render();
  } catch (e) {
    document.getElementById('usuariosList').innerHTML = `
      <div class="alert alert-danger m-3">Error al cargar usuarios: ${esc(e.message)}</div>`;
  }
}

document.getElementById('q').addEventListener('input', render);
document.getElementById('fRole').addEventListener('change', render);
document.getElementById('fEstado').addEventListener('change', render);

load();
