import { apiFetch } from '/js/api.js';
import { mountShell } from '/js/shell.js';
import { renderIcon } from '/js/icons.js';
import { modalidadLabel, contratoLabel, expLabel, formatSalario, timeAgo, escapeHtml, badgeForModalidad } from '/js/helpers.js';

const user = mountShell('CANDIDATO');
if (!user) throw new Error('Unauthorized');

const page = document.getElementById('page');
page.innerHTML = `
  <div style="max-width:1200px;margin:0 auto" class="ij-flex-col ij-gap-4">
    <div>
      <h1 class="ij-text-xl ij-font-bold">Buscar Vacantes</h1>
      <p class="ij-text-sm ij-text-muted">Descubre las oportunidades que mejor se adapten a ti.</p>
    </div>

    <div class="ij-card">
      <div class="ij-card-body">
        <div class="ij-grid ij-gap-3" style="grid-template-columns:2fr 1fr 1fr 1fr auto">
          <input id="q" class="ij-input" placeholder="Título, palabra clave o empresa...">
          <select id="fTrabajo" class="ij-select">
            <option value="">Modalidad</option>
            <option value="presencial">Presencial</option>
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
          </select>
          <select id="fContrato" class="ij-select">
            <option value="">Contrato</option>
            <option value="completo">Tiempo completo</option>
            <option value="medio">Medio tiempo</option>
            <option value="temporal">Temporal</option>
            <option value="freelance">Freelance</option>
          </select>
          <select id="fExp" class="ij-select">
            <option value="">Experiencia</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
          <button id="btnFiltro" class="ij-btn ij-btn-primary">${renderIcon('search')} Buscar</button>
        </div>
      </div>
    </div>

    <div id="results" class="ij-flex-col ij-gap-3">
      <p class="ij-text-sm ij-text-muted">Cargando vacantes...</p>
    </div>
  </div>

  <div id="postModal" class="ij-hidden" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:1rem">
    <div class="ij-card" style="max-width:480px;width:100%">
      <div class="ij-card-header">
        <div class="ij-card-title" id="pmTitle">Postular</div>
      </div>
      <div class="ij-card-body">
        <div id="pmAlert" class="ij-alert ij-alert-error ij-hidden"></div>
        <div class="ij-form-group">
          <label class="ij-label">Mensaje (opcional)</label>
          <textarea id="pmMensaje" class="ij-textarea" rows="4" placeholder="Cuéntale a la empresa por qué eres el candidato ideal..."></textarea>
        </div>
      </div>
      <div class="ij-flex ij-justify-end ij-gap-2" style="padding:0 1.25rem 1rem">
        <button id="pmCancel" class="ij-btn ij-btn-outline ij-btn-sm">Cancelar</button>
        <button id="pmSubmit" class="ij-btn ij-btn-primary ij-btn-sm">Enviar postulación</button>
      </div>
    </div>
  </div>
`;

const $ = (id) => document.getElementById(id);
const results = $('results');
let currentVac = null;

function renderCard(v) {
  return `
    <div class="ij-card ij-card-hover">
      <div class="ij-card-body">
        <div class="ij-flex ij-justify-between ij-items-start ij-gap-3">
          <div style="min-width:0;flex:1">
            <div class="ij-flex ij-items-center ij-gap-2 ij-mb-1">
              <h3 class="ij-text-md ij-font-bold">${escapeHtml(v.titulo)}</h3>
              <span class="ij-badge ${badgeForModalidad(v.tipo_trabajo)}">${modalidadLabel(v.tipo_trabajo)}</span>
            </div>
            <div class="ij-text-sm ij-text-muted ij-mb-2">${escapeHtml(v.empresa_nombre ?? '')}</div>
            <div class="ij-flex ij-gap-3 ij-text-xs ij-text-muted-2 ij-flex-wrap">
              <span>${renderIcon('mapPin')} ${escapeHtml(v.ubicacion)}</span>
              <span>${renderIcon('briefcase')} ${contratoLabel(v.tipo_contrato)}</span>
              <span>${renderIcon('star')} ${expLabel(v.experiencia)}</span>
              <span>${renderIcon('clock')} ${timeAgo(v.created_at)}</span>
            </div>
            <p class="ij-text-sm ij-mt-2 ij-line-clamp-2">${escapeHtml((v.descripcion ?? '').slice(0, 220))}</p>
            <div class="ij-text-sm ij-font-semibold ij-mt-2" style="color:var(--color-secondary)">${formatSalario(v.salario_min, v.salario_max)}</div>
          </div>
          <div class="ij-flex-col ij-gap-2">
            <button class="ij-btn ij-btn-primary ij-btn-sm"
              data-vid="${escapeHtml(v.id)}"
              data-vtitulo="${escapeHtml(v.titulo)}">
              Postularme
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function cargar() {
  results.innerHTML = '<p class="ij-text-sm ij-text-muted">Cargando...</p>';
  const params = new URLSearchParams();
  if ($('fTrabajo').value)  params.set('tipo_trabajo', $('fTrabajo').value);
  if ($('fContrato').value) params.set('tipo_contrato', $('fContrato').value);
  if ($('fExp').value)      params.set('experiencia', $('fExp').value);
  params.set('limit', '50');
  try {
    const r = await apiFetch(`/vacantes?${params}`);
    let items = r?.data ?? [];
    const q = $('q').value.trim().toLowerCase();
    if (q) items = items.filter(v =>
      (v.titulo ?? '').toLowerCase().includes(q) ||
      (v.empresa_nombre ?? '').toLowerCase().includes(q) ||
      (v.descripcion ?? '').toLowerCase().includes(q)
    );
    results.innerHTML = items.length
      ? items.map(renderCard).join('')
      : '<div class="ij-card"><div class="ij-card-body" style="text-align:center;padding:2rem"><p class="ij-text-sm ij-text-muted">No se encontraron vacantes con esos filtros.</p></div></div>';
  } catch {
    results.innerHTML = '<div class="ij-alert ij-alert-error">Error al cargar vacantes.</div>';
  }
}

$('btnFiltro').addEventListener('click', cargar);
$('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') cargar(); });

results.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-vid]');
  if (!b) return;
  currentVac = { id: b.dataset.vid, titulo: b.dataset.vtitulo };
  $('pmTitle').textContent = `Postular a: ${currentVac.titulo}`;
  $('pmMensaje').value = '';
  $('pmAlert').classList.add('ij-hidden');
  $('postModal').classList.remove('ij-hidden');
});

$('pmCancel').addEventListener('click', () => $('postModal').classList.add('ij-hidden'));
$('pmSubmit').addEventListener('click', async () => {
  if (!currentVac) return;
  const btn = $('pmSubmit');
  btn.disabled = true;
  try {
    await apiFetch(`/candidato/postulaciones/${currentVac.id}`, {
      method: 'POST',
      body: JSON.stringify({ mensaje: $('pmMensaje').value.trim() || undefined }),
    });
    $('postModal').classList.add('ij-hidden');
    alert('¡Postulación enviada!');
  } catch (err) {
    $('pmAlert').textContent = err.message ?? 'Error';
    $('pmAlert').classList.remove('ij-hidden');
  } finally { btn.disabled = false; }
});

cargar();
