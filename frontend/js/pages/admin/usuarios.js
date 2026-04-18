import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';
import { timeAgo, escapeHtml, initials } from '/js/helpers.js';

const user = mountShell('SUPERADMIN');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');
page.innerHTML = `
  <div style="max-width:1200px;margin:0 auto" class="ij-flex-col ij-gap-4">
    <div class="ij-flex ij-justify-between ij-items-center">
      <div>
        <h1 class="ij-text-xl ij-font-bold">Gestión de Usuarios</h1>
        <p class="ij-text-sm ij-text-muted">Administra los accesos del sistema.</p>
      </div>
      <div class="ij-flex ij-gap-2">
        <input id="q" class="ij-input ij-input-sm" placeholder="Buscar por nombre o email..." style="min-width:260px">
        <select id="fRole" class="ij-select ij-select-sm">
          <option value="">Todos los roles</option>
          <option value="CANDIDATO">Candidatos</option>
          <option value="EMPRESA">Empresas</option>
          <option value="SUPERADMIN">Admins</option>
        </select>
      </div>
    </div>

    <div class="ij-card">
      <div class="ij-card-body" id="list"><p class="ij-text-sm ij-text-muted">Cargando...</p></div>
    </div>
  </div>
`;

const $ = (id) => document.getElementById(id);
const roleBadge = { CANDIDATO: 'ij-badge-blue', EMPRESA: 'ij-badge-emerald', SUPERADMIN: 'ij-badge-purple' };
const roleLabel = { CANDIDATO: 'Candidato', EMPRESA: 'Empresa', SUPERADMIN: 'Admin' };

let all = [];

function render() {
  const q = $('q').value.trim().toLowerCase();
  const role = $('fRole').value;
  const items = all.filter(u => {
    if (role && u.role !== role) return false;
    if (q) {
      const s = `${u.nombre ?? ''} ${u.apellidos ?? ''} ${u.email ?? ''} ${u.empresa_nombre ?? ''}`.toLowerCase();
      if (!s.includes(q)) return false;
    }
    return true;
  });
  const ct = $('list');
  if (!items.length) { ct.innerHTML = '<p class="ij-text-sm ij-text-muted" style="text-align:center;padding:1.5rem">Sin resultados.</p>'; return; }
  ct.innerHTML = `
    <div class="ij-grid" style="grid-template-columns:2.5fr 1fr 1.5fr 1fr auto;gap:.5rem;padding:.5rem 0;border-bottom:1px solid var(--color-border-2)">
      <span class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-transform:uppercase">Usuario</span>
      <span class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-transform:uppercase">Rol</span>
      <span class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-transform:uppercase">Empresa</span>
      <span class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-transform:uppercase">Alta</span>
      <span class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-transform:uppercase;text-align:right">Acción</span>
    </div>
    ${items.map(u => `
      <div class="ij-grid" style="grid-template-columns:2.5fr 1fr 1.5fr 1fr auto;align-items:center;gap:.5rem;padding:.75rem 0;border-top:1px solid var(--color-border-2)">
        <div class="ij-flex ij-items-center ij-gap-3" style="min-width:0">
          <div class="ij-avatar">${initials(`${u.nombre ?? ''} ${u.apellidos ?? ''}`)}</div>
          <div style="min-width:0">
            <div class="ij-text-sm ij-font-medium ij-truncate">${escapeHtml(`${u.nombre ?? ''} ${u.apellidos ?? ''}`.trim() || '—')}</div>
            <div class="ij-text-xs ij-text-muted-2 ij-truncate">${escapeHtml(u.email ?? '')}</div>
          </div>
        </div>
        <span class="ij-badge ${roleBadge[u.role] ?? 'ij-badge-blue'}">${roleLabel[u.role] ?? u.role}</span>
        <span class="ij-text-sm ij-text-muted ij-truncate">${escapeHtml(u.empresa_nombre ?? '—')}</span>
        <span class="ij-text-xs ij-text-muted-2">${timeAgo(u.created_at)}</span>
        <div style="text-align:right">
          ${u.role === 'SUPERADMIN' ? '<span class="ij-text-xs ij-text-muted-2">—</span>' : `
            <button class="ij-btn ij-btn-sm ${u.is_active ? 'ij-btn-outline' : 'ij-btn-secondary'}" data-toggle="${u.id}">
              ${u.is_active ? 'Desactivar' : 'Activar'}
            </button>
          `}
        </div>
      </div>
    `).join('')}
  `;
  ct.querySelectorAll('[data-toggle]').forEach(b => {
    b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        await apiFetch(`/admin/usuarios/${b.dataset.toggle}/toggle`, { method: 'PATCH' });
        await load();
      } catch { b.disabled = false; alert('Error al cambiar estado'); }
    });
  });
}

async function load() {
  try { all = await apiFetch('/admin/usuarios'); render(); }
  catch { $('list').innerHTML = '<div class="ij-alert ij-alert-error">Error al cargar usuarios.</div>'; }
}

$('q').addEventListener('input', render);
$('fRole').addEventListener('change', render);
load();
