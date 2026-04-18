import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';

const user = mountShell('CANDIDATO');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');
page.innerHTML = `
  <div style="max-width:720px;margin:0 auto" class="ij-flex-col ij-gap-4">
    <div>
      <h1 class="ij-text-xl ij-font-bold">Mi Perfil</h1>
      <p class="ij-text-sm ij-text-muted">Mantén tu información actualizada para mejorar tus postulaciones.</p>
    </div>

    <div id="alert" class="ij-alert ij-alert-error ij-hidden"></div>
    <div id="success" class="ij-alert ij-alert-success ij-hidden"></div>

    <form id="perfilForm">
      <div class="ij-card">
        <div class="ij-card-header">
          <div class="ij-card-title">Datos personales</div>
          <div class="ij-card-desc">Esta información será visible para las empresas.</div>
        </div>
        <div class="ij-card-body">
          <div class="ij-grid ij-gap-4" style="grid-template-columns:1fr 1fr">
            <div class="ij-form-group">
              <label class="ij-label">Nombre</label>
              <input id="nombre" class="ij-input" required>
            </div>
            <div class="ij-form-group">
              <label class="ij-label">Apellidos</label>
              <input id="apellidos" class="ij-input" required>
            </div>
          </div>
          <div class="ij-form-group">
            <label class="ij-label">Email</label>
            <input id="email" class="ij-input" disabled>
          </div>
          <div class="ij-form-group">
            <label class="ij-label">Teléfono</label>
            <input id="telefono" class="ij-input" placeholder="+503 7777-7777">
          </div>
          <div class="ij-form-group">
            <label class="ij-label">URL de tu CV</label>
            <input id="cvUrl" type="url" class="ij-input" placeholder="https://...">
            <p class="ij-text-xs ij-text-muted-2 ij-mt-1">Puedes subirlo a Drive, Dropbox o cualquier servicio público.</p>
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
    const p = await apiFetch('/candidato/perfil');
    $('nombre').value    = p.nombre ?? '';
    $('apellidos').value = p.apellidos ?? '';
    $('email').value     = p.email ?? '';
    $('telefono').value  = p.telefono ?? '';
    $('cvUrl').value     = p.cv_url ?? '';
  } catch { alertEl.textContent = 'No se pudo cargar tu perfil.'; alertEl.classList.remove('ij-hidden'); }
})();

$('perfilForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('ij-hidden'); okEl.classList.add('ij-hidden');
  btn.disabled = true;
  try {
    const body = {
      nombre:    $('nombre').value.trim(),
      apellidos: $('apellidos').value.trim(),
      telefono:  $('telefono').value.trim() || undefined,
    };
    const cv = $('cvUrl').value.trim();
    if (cv) body.cvUrl = cv;
    await apiFetch('/candidato/perfil', { method: 'PUT', body: JSON.stringify(body) });
    okEl.textContent = 'Perfil actualizado correctamente.';
    okEl.classList.remove('ij-hidden');
  } catch (err) {
    alertEl.textContent = err.message ?? 'Error al actualizar'; alertEl.classList.remove('ij-hidden');
  } finally { btn.disabled = false; }
});
