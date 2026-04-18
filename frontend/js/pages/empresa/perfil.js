import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';

const user = mountShell('EMPRESA');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');
page.innerHTML = `
  <div style="max-width:820px;margin:0 auto" class="ij-flex-col ij-gap-4">
    <div class="ij-flex ij-justify-between ij-items-start">
      <div>
        <h1 class="ij-text-xl ij-font-bold">Perfil de Empresa</h1>
        <p class="ij-text-sm ij-text-muted">Información que verán los candidatos.</p>
      </div>
      <span id="verifBadge" class="ij-badge ij-badge-yellow">● Pendiente de verificación</span>
    </div>

    <div id="alert" class="ij-alert ij-alert-error ij-hidden"></div>
    <div id="success" class="ij-alert ij-alert-success ij-hidden"></div>

    <form id="empForm">
      <div class="ij-card">
        <div class="ij-card-header">
          <div class="ij-card-title">Datos de la empresa</div>
        </div>
        <div class="ij-card-body">
          <div class="ij-form-group">
            <label class="ij-label">Nombre comercial</label>
            <input id="nombre" class="ij-input" required>
          </div>
          <div class="ij-form-group">
            <label class="ij-label">Descripción</label>
            <textarea id="descripcion" class="ij-textarea" rows="4" placeholder="Qué hace la empresa, cultura, valores..."></textarea>
          </div>
          <div class="ij-grid ij-gap-4" style="grid-template-columns:1fr 1fr">
            <div class="ij-form-group">
              <label class="ij-label">Sitio web</label>
              <input id="sitioWeb" type="url" class="ij-input" placeholder="https://tuempresa.com">
            </div>
            <div class="ij-form-group">
              <label class="ij-label">Industria</label>
              <input id="industria" class="ij-input" placeholder="Tecnología, Salud, Retail...">
            </div>
          </div>
          <div class="ij-form-group">
            <label class="ij-label">Ubicación principal</label>
            <input id="ubicacion" class="ij-input" placeholder="San Salvador, El Salvador">
          </div>
        </div>
      </div>
      <div class="ij-flex ij-justify-end ij-mt-4">
        <button type="submit" class="ij-btn ij-btn-primary" id="btnSubmit">
          ${renderIcon('check')} Guardar cambios
        </button>
      </div>
    </form>
  </div>
`;

const $ = (id) => document.getElementById(id);
const alertEl = $('alert'), okEl = $('success'), btn = $('btnSubmit');

(async () => {
  try {
    const p = await apiFetch('/empresa/perfil');
    $('nombre').value      = p.nombre ?? '';
    $('descripcion').value = p.descripcion ?? '';
    $('sitioWeb').value    = p.sitio_web ?? '';
    $('industria').value   = p.industria ?? '';
    $('ubicacion').value   = p.ubicacion ?? '';
    const vb = $('verifBadge');
    if (p.is_verified) { vb.className = 'ij-badge ij-badge-emerald'; vb.textContent = '● Verificada'; }
  } catch { alertEl.textContent = 'No se pudo cargar el perfil.'; alertEl.classList.remove('ij-hidden'); }
})();

$('empForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('ij-hidden'); okEl.classList.add('ij-hidden');
  btn.disabled = true;
  try {
    const body = { nombre: $('nombre').value.trim() };
    const d = $('descripcion').value.trim(); if (d) body.descripcion = d;
    const s = $('sitioWeb').value.trim();    if (s) body.sitioWeb = s;
    const u = $('ubicacion').value.trim();   if (u) body.ubicacion = u;
    const i = $('industria').value.trim();   if (i) body.industria = i;
    await apiFetch('/empresa/perfil', { method: 'PUT', body: JSON.stringify(body) });
    okEl.textContent = 'Perfil actualizado.'; okEl.classList.remove('ij-hidden');
  } catch (err) {
    alertEl.textContent = err.message ?? 'Error al actualizar'; alertEl.classList.remove('ij-hidden');
  } finally { btn.disabled = false; }
});
