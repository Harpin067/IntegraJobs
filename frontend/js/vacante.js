// frontend/js/vacante.js
import { formatSalario, modalidadLabel, badgeForModalidad, contratoLabel, expLabel, timeAgo, escapeHtml, initials } from '/js/helpers.js';
import { getToken, getUser } from '/js/auth.js';

const id = new URLSearchParams(location.search).get('id');

if (!id) {
  document.getElementById('mainContent').innerHTML =
    `<div class="detail-card" style="text-align:center;padding:3rem">
       <p class="ij-text-danger ij-font-semibold">No se especificó una vacante.</p>
       <a href="/busqueda.html" class="ij-btn ij-btn-primary" style="margin-top:1rem;display:inline-flex">← Ver empleos</a>
     </div>`;
} else {
  cargar(id);
}

async function cargar(vacanteId) {
  try {
    const res = await fetch(`/api/public/vacantes/${encodeURIComponent(vacanteId)}`);
    if (!res.ok) throw Object.assign(new Error(), { status: res.status });
    const v = await res.json();
    renderDetalle(v);
  } catch (err) {
    const msg = err.status === 404
      ? 'Esta vacante no existe o ya no está disponible.'
      : 'Error al cargar la vacante. Intenta más tarde.';
    document.getElementById('mainContent').innerHTML =
      `<div class="detail-card" style="text-align:center;padding:3rem">
         <div style="font-size:2.5rem;margin-bottom:1rem;color:#9ca3af"><i class="bi bi-emoji-frown"></i></div>
         <p class="ij-font-semibold" style="margin-bottom:.5rem">${msg}</p>
         <a href="/busqueda.html" class="ij-btn ij-btn-primary" style="margin-top:1rem;display:inline-flex">← Ver empleos</a>
       </div>`;
    document.getElementById('sidebar').innerHTML = '';
  }
}

function logoFallback(nombre) {
  return `<div style="width:3.5rem;height:3.5rem;border-radius:var(--radius-lg);background:var(--color-primary-15);color:var(--color-primary);font-weight:700;font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">${initials(nombre)}</div>`;
}

function renderDetalle(v) {
  // Breadcrumb
  document.getElementById('breadcrumbTitulo').textContent = v.titulo;
  document.title = `${v.titulo} — IntegraJobs`;

  // ── Main card ────────────────────────────────────────────────────────
  document.getElementById('mainContent').innerHTML = `
    <div class="detail-card" style="margin-bottom:1.5rem">
      <div class="ij-flex ij-items-start ij-gap-4" style="margin-bottom:1.5rem">
        ${v.empresa_logo
          ? `<img src="${escapeHtml(v.empresa_logo)}" alt="${escapeHtml(v.empresa_nombre)}" style="width:3.5rem;height:3.5rem;border-radius:var(--radius-lg);object-fit:contain;border:1px solid var(--color-border-2);flex-shrink:0" onerror="this.outerHTML='${logoFallback(v.empresa_nombre)}'"/>`
          : logoFallback(v.empresa_nombre)
        }
        <div>
          <h1 style="font-size:1.5rem;font-weight:800;letter-spacing:-.02em;margin-bottom:.375rem">${escapeHtml(v.titulo)}</h1>
          <div class="ij-text-sm ij-text-muted-2">
            <strong style="color:var(--color-text)">${escapeHtml(v.empresa_nombre ?? '')}</strong>
            &nbsp;·&nbsp; ${escapeHtml(v.ubicacion)}
            &nbsp;·&nbsp; ${timeAgo(v.created_at)}
          </div>
        </div>
      </div>

      <div class="ij-flex ij-gap-2" style="flex-wrap:wrap;margin-bottom:1.75rem">
        <span class="ij-badge ${badgeForModalidad(v.tipo_trabajo)}">${modalidadLabel(v.tipo_trabajo)}</span>
        <span class="pill">${contratoLabel(v.tipo_contrato)}</span>
        <span class="pill gray">${expLabel(v.experiencia)}</span>
        ${v.salario_min || v.salario_max
          ? `<span class="pill green">${formatSalario(v.salario_min, v.salario_max)}</span>`
          : ''}
      </div>

      <h2 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">Descripción del puesto</h2>
      <p style="line-height:1.75;color:var(--color-text);white-space:pre-line;margin-bottom:1.75rem">${escapeHtml(v.descripcion)}</p>

      <h2 style="font-size:1rem;font-weight:700;margin-bottom:.75rem">Requisitos</h2>
      <p style="line-height:1.75;color:var(--color-text);white-space:pre-line">${escapeHtml(v.requisitos)}</p>
    </div>

    <a href="/busqueda.html" class="ij-text-sm ij-text-muted" style="display:inline-flex;align-items:center;gap:.4rem">
      ← Volver a resultados
    </a>
  `;

  // ── Sidebar ───────────────────────────────────────────────────────────
  document.getElementById('sidebar').innerHTML = `
    <div class="company-card" style="margin-bottom:1rem">
      <div class="ij-text-xs ij-font-semibold" style="color:var(--color-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.875rem">Sobre la empresa</div>
      <div class="ij-flex ij-items-center ij-gap-3" style="margin-bottom:.875rem">
        ${v.empresa_logo
          ? `<img src="${escapeHtml(v.empresa_logo)}" style="width:2.5rem;height:2.5rem;border-radius:var(--radius);object-fit:contain;border:1px solid var(--color-border-2)" onerror="this.style.display='none'"/>`
          : ''
        }
        <div>
          <div class="ij-font-semibold">${escapeHtml(v.empresa_nombre ?? '')}</div>
          ${v.empresa_verificada ? `<span class="ij-badge ij-badge-green" style="font-size:.7rem">✓ Verificada</span>` : ''}
        </div>
      </div>
      ${v.empresa_descripcion ? `<p class="ij-text-sm ij-text-muted" style="line-height:1.6;margin-bottom:.75rem">${escapeHtml(v.empresa_descripcion)}</p>` : ''}
      <div class="ij-text-xs ij-text-muted-2" style="display:flex;flex-direction:column;gap:.375rem">
        ${v.empresa_ubicacion ? `<span>${escapeHtml(v.empresa_ubicacion)}</span>` : ''}
        ${v.empresa_industria ? `<span>${escapeHtml(v.empresa_industria)}</span>` : ''}
        ${v.empresa_sitio ? `<a href="${escapeHtml(v.empresa_sitio)}" target="_blank" rel="noopener" style="color:var(--color-primary)">Sitio web</a>` : ''}
      </div>
    </div>

    <button class="postulate-btn" id="btnPostular">
      Quiero postularme →
    </button>
    <p class="ij-text-xs ij-text-muted-2" id="txtCuenta" style="text-align:center;margin-top:.75rem">
      Se requiere una cuenta para postular. Es gratis.
    </p>
  `;

  const btn       = document.getElementById('btnPostular');
  const txtCuenta = document.getElementById('txtCuenta');
  const token     = getToken();
  const user      = getUser();
  const esCandidato = token && user?.role === 'CANDIDATO';

  if (esCandidato) {
    // ── Usuario autenticado como candidato ──────────────────────────────
    txtCuenta.style.display = 'none';

    btn.addEventListener('click', async () => {
      btn.disabled    = true;
      btn.textContent = 'Postulando...';

      try {
        const res = await fetch(`/api/candidato/postulaciones/${encodeURIComponent(v.id)}`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          btn.disabled = false;
          btn.textContent = 'Quiero postularme →';
          const msg = data.error ?? `Error ${res.status}`;
          const errEl = document.createElement('p');
          errEl.className = 'ij-text-xs';
          errEl.style.cssText = 'color:var(--color-danger);text-align:center;margin-top:.75rem';
          errEl.textContent = msg;
          btn.insertAdjacentElement('afterend', errEl);
          return;
        }

        btn.style.background = 'var(--color-secondary)';
        btn.style.boxShadow  = '0 4px 16px rgba(16,185,129,.35)';
        btn.textContent      = '¡Te has postulado!';
      } catch {
        btn.disabled    = false;
        btn.textContent = 'Quiero postularme →';
        const errEl = document.createElement('p');
        errEl.className = 'ij-text-xs';
        errEl.style.cssText = 'color:var(--color-danger);text-align:center;margin-top:.75rem';
        errEl.textContent = 'Error de conexión. Intenta de nuevo.';
        btn.insertAdjacentElement('afterend', errEl);
      }
    });

  } else {
    // ── Usuario no autenticado — redirigir al login ─────────────────────
    btn.addEventListener('click', () => {
      const redirectUrl = `/vacante.html?id=${encodeURIComponent(id)}`;
      window.location.href = `/pages/login.html?redirect=${encodeURIComponent(redirectUrl)}`;
    });
  }
}
