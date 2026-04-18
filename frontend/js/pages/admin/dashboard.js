import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';
import { timeAgo, escapeHtml, initials, modalidadLabel } from '/js/helpers.js';

const user = mountShell('SUPERADMIN');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');

page.innerHTML = `
  <div style="max-width:1100px;margin:0 auto" class="ij-flex-col ij-gap-4">
    <div class="ij-flex ij-justify-between ij-items-start">
      <div>
        <div class="ij-flex ij-items-center ij-gap-2" style="color:#60a5fa;margin-bottom:.25rem">
          ${renderIcon('shield')}
          <h1 class="ij-text-xl ij-font-bold" style="color:var(--color-text)">Panel de Control Global</h1>
        </div>
        <p class="ij-text-sm ij-text-muted">Vista general del estado de IntegraJobs · El Salvador</p>
      </div>
      <span class="ij-badge ij-badge-emerald">● Sistema operativo</span>
    </div>

    <div class="ij-grid ij-grid-cols-4 ij-gap-4">
      ${mCard('Total Usuarios', 'totalUsers', 'users')}
      ${mCard('Empresas pendientes', 'empPend', 'building')}
      ${mCard('Vacantes activas', 'vacAct', 'briefcase')}
      ${mCard('Vacantes pendientes', 'vacPend', 'alertTri')}
    </div>

    <div class="ij-card" id="empresas">
      <div class="ij-card-header ij-flex ij-items-center ij-gap-2">
        <span style="color:#F59E0B">${renderIcon('clock')}</span>
        <div class="ij-card-title">Empresas pendientes de activación</div>
      </div>
      <div class="ij-card-body" id="empresasList"><p class="ij-text-sm ij-text-muted">Cargando...</p></div>
    </div>

    <div class="ij-card" id="vacantes">
      <div class="ij-card-header ij-flex ij-items-center ij-gap-2">
        <span style="color:var(--color-primary)">${renderIcon('briefcase')}</span>
        <div class="ij-card-title">Vacantes pendientes de aprobación</div>
      </div>
      <div class="ij-card-body" id="vacantesList"><p class="ij-text-sm ij-text-muted">Cargando...</p></div>
    </div>
  </div>
`;

function mCard(label, id, icon) {
  return `<div class="ij-card"><div class="ij-card-body">
    <div class="ij-flex ij-justify-between ij-items-center ij-mb-3">
      <div style="background:var(--color-primary-15);color:var(--color-primary);padding:.5rem;border-radius:.5rem;display:flex">${renderIcon(icon)}</div>
    </div>
    <div class="ij-text-2xl ij-font-bold" id="m-${id}">—</div>
    <div class="ij-text-xs ij-font-medium ij-text-muted ij-mt-1">${label}</div>
  </div></div>`;
}

(async () => {
  try {
    const [usuarios, empresas, vacantes] = await Promise.all([
      apiFetch('/admin/usuarios'),
      apiFetch('/admin/empresas/pendientes'),
      apiFetch('/admin/vacantes/pendientes'),
    ]);
    document.getElementById('m-totalUsers').textContent = usuarios.length;
    document.getElementById('m-empPend').textContent   = empresas.length;
    document.getElementById('m-vacPend').textContent   = vacantes.length;

    // Active vacancies (public endpoint)
    try {
      const r = await apiFetch('/vacantes?limit=500');
      document.getElementById('m-vacAct').textContent = r?.data?.length ?? '0';
    } catch { document.getElementById('m-vacAct').textContent = '0'; }

    const eCt = document.getElementById('empresasList');
    eCt.innerHTML = empresas.length ? empresas.map(c => `
      <div class="ij-flex ij-justify-between ij-items-center" style="padding:.75rem 0;border-top:1px solid var(--color-border-2)">
        <div class="ij-flex ij-items-center ij-gap-3" style="min-width:0">
          <div class="ij-avatar">${initials(c.nombre)}</div>
          <div style="min-width:0">
            <div class="ij-text-sm ij-font-medium ij-truncate">${escapeHtml(c.nombre)}</div>
            <div class="ij-text-xs ij-text-muted-2 ij-truncate">${escapeHtml(c.user_email ?? '')} · ${escapeHtml(c.industria ?? '')} · ${timeAgo(c.created_at)}</div>
          </div>
        </div>
        <div class="ij-flex ij-gap-2">
          <button class="ij-btn ij-btn-secondary ij-btn-sm" data-verify="${c.id}">Verificar</button>
        </div>
      </div>
    `).join('') : '<p class="ij-text-sm ij-text-muted" style="text-align:center;padding:1.5rem 0">No hay empresas pendientes.</p>';

    eCt.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-verify]');
      if (!b) return;
      b.disabled = true;
      try {
        await apiFetch(`/admin/empresas/${b.dataset.verify}/verificar`, { method: 'PATCH', body: JSON.stringify({ verificar: true }) });
        location.reload();
      } catch (e) { b.disabled = false; }
    });

    const vCt = document.getElementById('vacantesList');
    vCt.innerHTML = vacantes.length ? vacantes.map(v => `
      <div class="ij-flex ij-justify-between ij-items-start" style="padding:.75rem 0;border-top:1px solid var(--color-border-2);gap:.75rem">
        <div style="min-width:0;flex:1">
          <div class="ij-text-sm ij-font-medium ij-truncate">${escapeHtml(v.titulo)}</div>
          <div class="ij-text-xs ij-text-muted-2">${escapeHtml(v.empresa_nombre ?? '')} · ${escapeHtml(v.ubicacion)} · ${modalidadLabel(v.tipo_trabajo)}</div>
        </div>
        <div class="ij-flex ij-gap-2">
          <button class="ij-btn ij-btn-secondary ij-btn-sm" data-vac="${v.id}" data-act="true">Aprobar</button>
          <button class="ij-btn ij-btn-outline ij-btn-sm" data-vac="${v.id}" data-act="false">Rechazar</button>
        </div>
      </div>
    `).join('') : '<p class="ij-text-sm ij-text-muted" style="text-align:center;padding:1.5rem 0">No hay vacantes pendientes.</p>';

    vCt.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-vac]');
      if (!b) return;
      b.disabled = true;
      try {
        await apiFetch(`/admin/vacantes/${b.dataset.vac}/aprobar`, { method: 'PATCH', body: JSON.stringify({ aprobar: b.dataset.act === 'true' }) });
        location.reload();
      } catch (e) { b.disabled = false; }
    });
  } catch (e) {
    page.insertAdjacentHTML('beforeend', '<div class="ij-alert ij-alert-error">Error al cargar datos.</div>');
  }
})();
