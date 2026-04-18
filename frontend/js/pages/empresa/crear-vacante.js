import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';

const user = mountShell('EMPRESA');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');
page.innerHTML = `
  <div style="max-width:720px;margin:0 auto" class="ij-flex-col ij-gap-4">
    <div class="ij-flex ij-items-center ij-gap-3">
      <a href="/pages/empresa/dashboard.html" class="ij-btn ij-btn-ghost ij-btn-sm" style="width:2rem;padding:0;height:2rem">${renderIcon('arrowLeft')}</a>
      <div>
        <h1 class="ij-text-xl ij-font-bold">Publicar nueva oportunidad</h1>
        <p class="ij-text-sm ij-text-muted">Completa la información para atraer al mejor talento.</p>
      </div>
    </div>

    <div id="alert" class="ij-alert ij-alert-error ij-hidden"></div>
    <div id="success" class="ij-alert ij-alert-success ij-hidden"></div>

    <form id="vacanteForm">
      <div class="ij-card">
        <div class="ij-card-header">
          <div class="ij-card-title">Datos del puesto</div>
          <div class="ij-card-desc">Información principal que verán los candidatos.</div>
        </div>
        <div class="ij-card-body">
          <div class="ij-form-group">
            <label class="ij-label">Título del puesto <span class="ij-required">*</span></label>
            <input id="titulo" class="ij-input" required placeholder="Ej. Frontend Developer React">
          </div>
          <div class="ij-form-group">
            <label class="ij-label">Ubicación <span class="ij-required">*</span></label>
            <select id="ubicacion" class="ij-select" required>
              <option value="" disabled selected>Selecciona ciudad</option>
              <option>San Salvador</option><option>Santa Tecla</option><option>Antiguo Cuscatlán</option>
              <option>San Miguel</option><option>Santa Ana</option><option>Soyapango</option>
              <option>Mejicanos</option><option>Remoto</option>
            </select>
          </div>
          <div class="ij-grid ij-gap-4" style="grid-template-columns:1fr 1fr">
            <div class="ij-form-group">
              <label class="ij-label">Modalidad <span class="ij-required">*</span></label>
              <select id="tipoTrabajo" class="ij-select" required>
                <option value="presencial">Presencial</option>
                <option value="hibrido">Híbrido</option>
                <option value="remoto">Remoto</option>
              </select>
            </div>
            <div class="ij-form-group">
              <label class="ij-label">Tipo de contrato <span class="ij-required">*</span></label>
              <select id="tipoContrato" class="ij-select" required>
                <option value="completo">Tiempo completo</option>
                <option value="medio">Medio tiempo</option>
                <option value="temporal">Temporal</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>
          <div class="ij-grid ij-gap-4" style="grid-template-columns:1fr 1fr">
            <div class="ij-form-group">
              <label class="ij-label">Salario mínimo (USD)</label>
              <input id="salarioMin" type="number" min="0" step="100" class="ij-input" placeholder="1000">
            </div>
            <div class="ij-form-group">
              <label class="ij-label">Salario máximo (USD)</label>
              <input id="salarioMax" type="number" min="0" step="100" class="ij-input" placeholder="1500">
            </div>
          </div>
          <div class="ij-form-group">
            <label class="ij-label">Nivel de experiencia <span class="ij-required">*</span></label>
            <select id="experiencia" class="ij-select" required>
              <option value="junior">Junior (0-2 años)</option>
              <option value="mid">Mid (2-5 años)</option>
              <option value="senior">Senior (5+ años)</option>
              <option value="lead">Lead / Manager</option>
            </select>
          </div>
          <div class="ij-form-group">
            <label class="ij-label">Email de contacto <span class="ij-required">*</span></label>
            <input id="contacto" type="email" class="ij-input" required placeholder="rrhh@tuempresa.com">
          </div>
        </div>
      </div>

      <div class="ij-card ij-mt-4">
        <div class="ij-card-header">
          <div class="ij-card-title">Descripción</div>
          <div class="ij-card-desc">Detalla responsabilidades, beneficios y requisitos.</div>
        </div>
        <div class="ij-card-body">
          <div class="ij-form-group">
            <label class="ij-label">Descripción del puesto <span class="ij-required">*</span></label>
            <textarea id="descripcion" class="ij-textarea" rows="5" required placeholder="Describe responsabilidades, beneficios, cultura..."></textarea>
          </div>
          <div class="ij-form-group">
            <label class="ij-label">Requisitos y habilidades <span class="ij-required">*</span></label>
            <textarea id="requisitos" class="ij-textarea" rows="3" required placeholder="3 años con React, inglés intermedio, TypeScript..."></textarea>
          </div>
        </div>
      </div>

      <div class="ij-flex ij-justify-between ij-mt-4" style="padding-bottom:1rem">
        <a href="/pages/empresa/dashboard.html" class="ij-btn ij-btn-outline ij-btn-sm">Cancelar</a>
        <button type="submit" class="ij-btn ij-btn-primary" id="btnSubmit">Publicar vacante</button>
      </div>
    </form>
  </div>
`;

const alertEl = document.getElementById('alert');
const okEl    = document.getElementById('success');
const btn     = document.getElementById('btnSubmit');

document.getElementById('vacanteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('ij-hidden');
  btn.disabled = true; btn.textContent = 'Publicando...';
  const smin = document.getElementById('salarioMin').value;
  const smax = document.getElementById('salarioMax').value;
  try {
    await apiFetch('/vacantes', {
      method: 'POST',
      body: JSON.stringify({
        titulo:       document.getElementById('titulo').value.trim(),
        descripcion:  document.getElementById('descripcion').value.trim(),
        requisitos:   document.getElementById('requisitos').value.trim(),
        ubicacion:    document.getElementById('ubicacion').value,
        contacto:     document.getElementById('contacto').value.trim(),
        tipoTrabajo:  document.getElementById('tipoTrabajo').value,
        tipoContrato: document.getElementById('tipoContrato').value,
        experiencia:  document.getElementById('experiencia').value,
        salarioMin:   smin ? Number(smin) : undefined,
        salarioMax:   smax ? Number(smax) : undefined,
      }),
    });
    okEl.innerHTML = 'Vacante publicada. Está pendiente de aprobación. <a href="/pages/empresa/dashboard.html">Volver al panel</a>.';
    okEl.classList.remove('ij-hidden');
    document.getElementById('vacanteForm').style.display = 'none';
  } catch (err) {
    alertEl.textContent = err.message ?? 'Error al publicar'; alertEl.classList.remove('ij-hidden');
    btn.disabled = false; btn.textContent = 'Publicar vacante';
  }
});
