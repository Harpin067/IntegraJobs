import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';
import { badgeForStatus, statusVacanteLabel, statusAppLabel, modalidadLabel, timeAgo, escapeHtml, initials } from '/js/helpers.js';

const user = mountShell('EMPRESA');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');
page.innerHTML = `<div style="max-width:1100px;margin:0 auto" id="wrap"><p class="ij-text-sm ij-text-muted">Cargando...</p></div>`;
const wrap = document.getElementById('wrap');

const APP_STATUSES = ['nuevo','en_proceso','rechazado','contratado'];

async function renderList() {
  const vacantes = await apiFetch('/empresa/vacantes');
  wrap.innerHTML = `
    <div class="ij-flex ij-justify-between ij-items-center ij-mb-4">
      <div>
        <h1 class="ij-text-xl ij-font-bold">Mis Vacantes</h1>
        <p class="ij-text-sm ij-text-muted">Gestiona todas las vacantes publicadas.</p>
      </div>
      <a href="/pages/empresa/crear-vacante.html" class="ij-btn ij-btn-primary ij-btn-sm">${renderIcon('plus')} Nueva vacante</a>
    </div>
    ${vacantes.length ? vacantes.map(v => `
      <div class="ij-card ij-mb-3 ij-card-hover" data-vac="${v.id}" style="cursor:pointer">
        <div class="ij-card-body">
          <div class="ij-flex ij-justify-between ij-items-start ij-gap-3">
            <div style="min-width:0;flex:1">
              <div class="ij-flex ij-items-center ij-gap-2 ij-mb-1">
                <h3 class="ij-text-md ij-font-bold ij-truncate">${escapeHtml(v.titulo)}</h3>
                <span class="ij-badge ${badgeForStatus(v.status)}">${statusVacanteLabel(v.status)}</span>
                ${v.is_approved ? '' : '<span class="ij-badge ij-badge-yellow">Pendiente</span>'}
              </div>
              <div class="ij-text-xs ij-text-muted-2">${escapeHtml(v.ubicacion)} · ${modalidadLabel(v.tipo_trabajo)} · ${timeAgo(v.created_at)}</div>
            </div>
            <div class="ij-text-center">
              <div class="ij-text-2xl ij-font-bold" style="color:var(--color-primary)">${v.total_aplicaciones ?? 0}</div>
              <div class="ij-text-xs ij-text-muted-2">postulantes</div>
            </div>
          </div>
        </div>
      </div>
    `).join('') : `
      <div class="ij-card"><div class="ij-card-body" style="text-align:center;padding:3rem 1rem">
        <p class="ij-text-sm ij-text-muted ij-mb-3">Aún no has publicado ninguna vacante</p>
        <a href="/pages/empresa/crear-vacante.html" class="ij-btn ij-btn-primary ij-btn-sm">Crear primera vacante</a>
      </div></div>
    `}
  `;
  wrap.querySelectorAll('[data-vac]').forEach(el => {
    el.addEventListener('click', () => { location.hash = el.dataset.vac; });
  });
}

async function renderDetalle(vacId) {
  wrap.innerHTML = '<p class="ij-text-sm ij-text-muted">Cargando detalle...</p>';
  try {
    const [vac, apps] = await Promise.all([
      apiFetch(`/vacantes/${vacId}`),
      apiFetch(`/empresa/vacantes/${vacId}/aplicaciones`),
    ]);
    wrap.innerHTML = `
      <div class="ij-flex ij-items-center ij-gap-3 ij-mb-3">
        <a href="#" id="back" class="ij-btn ij-btn-ghost ij-btn-sm" style="width:2rem;padding:0;height:2rem">${renderIcon('arrowLeft')}</a>
        <div>
          <h1 class="ij-text-xl ij-font-bold">${escapeHtml(vac.titulo)}</h1>
          <p class="ij-text-sm ij-text-muted">${escapeHtml(vac.ubicacion)} · ${modalidadLabel(vac.tipo_trabajo)}</p>
        </div>
      </div>
      <div class="ij-card ij-mb-4">
        <div class="ij-card-header"><div class="ij-card-title">Descripción</div></div>
        <div class="ij-card-body">
          <p class="ij-text-sm" style="white-space:pre-wrap">${escapeHtml(vac.descripcion)}</p>
          <div class="ij-mt-3">
            <div class="ij-text-xs ij-font-medium ij-text-muted-2" style="text-transform:uppercase">Requisitos</div>
            <p class="ij-text-sm ij-mt-1" style="white-space:pre-wrap">${escapeHtml(vac.requisitos)}</p>
          </div>
        </div>
      </div>
      <div class="ij-card">
        <div class="ij-card-header"><div class="ij-card-title">Postulantes (${apps.length})</div></div>
        <div class="ij-card-body" id="appsList">
          ${apps.length ? apps.map(a => `
            <div class="ij-flex ij-justify-between ij-items-center" style="padding:.75rem 0;border-top:1px solid var(--color-border-2);gap:.75rem">
              <div class="ij-flex ij-items-center ij-gap-3" style="min-width:0;flex:1">
                <div class="ij-avatar">${initials(a.candidato_nombre)}</div>
                <div style="min-width:0">
                  <div class="ij-text-sm ij-font-medium ij-truncate">${escapeHtml(a.candidato_nombre ?? '')}</div>
                  <div class="ij-text-xs ij-text-muted-2 ij-truncate">${escapeHtml(a.candidato_email ?? '')} · ${timeAgo(a.created_at)}</div>
                </div>
              </div>
              <div class="ij-flex ij-items-center ij-gap-2">
                ${a.candidato_cv ? `<a href="${escapeHtml(a.candidato_cv)}" target="_blank" class="ij-btn ij-btn-outline ij-btn-sm">CV</a>` : ''}
                <select class="ij-select ij-select-sm" data-app="${a.id}">
                  ${APP_STATUSES.map(s => `<option value="${s}" ${s===a.status?'selected':''}>${statusAppLabel(s)}</option>`).join('')}
                </select>
              </div>
            </div>
          `).join('') : '<p class="ij-text-sm ij-text-muted" style="text-align:center;padding:1.5rem 0">Aún no hay postulantes.</p>'}
        </div>
      </div>
    `;
    document.getElementById('back').addEventListener('click', (e) => { e.preventDefault(); location.hash = ''; });
    wrap.querySelectorAll('[data-app]').forEach(sel => {
      sel.addEventListener('change', async () => {
        sel.disabled = true;
        try {
          await apiFetch(`/empresa/aplicaciones/${sel.dataset.app}/status`, {
            method: 'PATCH', body: JSON.stringify({ status: sel.value }),
          });
        } catch (e) { alert('Error al cambiar estado'); }
        finally { sel.disabled = false; }
      });
    });
  } catch {
    wrap.innerHTML = '<div class="ij-alert ij-alert-error">Error al cargar la vacante.</div>';
  }
}

function route() {
  const h = location.hash.replace('#', '');
  if (h) renderDetalle(h); else renderList();
}
window.addEventListener('hashchange', route);
route();
