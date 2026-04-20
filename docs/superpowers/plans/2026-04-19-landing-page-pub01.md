# Landing Page PUB-01 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar `frontend/index.html` en una landing de alto impacto con datos reales de BD, logo generado por IA y búsqueda funcional.

**Architecture:** Nuevo endpoint público `GET /api/public/stats` (sin auth) que agrega en una sola query los contadores, vacantes recientes e industrias top. El frontend hace un único fetch al cargar, renderiza skeleton loaders mientras espera, y reemplaza con datos reales. El logo se genera con NanoBanana MCP y se integra en el nav.

**Tech Stack:** Express 5, pg Pool (raw SQL), HTML Vanilla, ij-* CSS (theme.css), ES Modules

---

## File Map

| Acción | Archivo |
|---|---|
| **Crear** | `backend/src/services/public.service.js` |
| **Crear** | `backend/src/routes/public.routes.js` |
| **Crear** | `backend/src/tests/public.test.js` |
| **Modificar** | `backend/src/app.js` — registrar `/api/public` |
| **Crear** | `frontend/img/logo-nanobanana.png` (MCP) |
| **Modificar** | `frontend/index.html` — refactor completo |
| **Modificar** | `frontend/js/index.js` — fetch único + skeletons |

---

## Task 1: Servicio público `public.service.js`

**Files:**
- Create: `backend/src/services/public.service.js`

- [ ] **Step 1: Crear el servicio**

```js
// backend/src/services/public.service.js
import { pool } from '../db/db.js';

export const getLandingStats = async () => {
  const [vacantes, empresas, recientes, industrias] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total FROM vacancies WHERE status = 'activa' AND is_approved = true`
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM companies`
    ),
    pool.query(
      `SELECT v.id, v.titulo, v.ubicacion, v.tipo_trabajo, v.tipo_contrato,
              v.salario_min, v.salario_max, v.experiencia, v.created_at,
              c.nombre AS empresa_nombre, c.logo_url AS empresa_logo
       FROM vacancies v
       JOIN companies c ON c.id = v.company_id
       WHERE v.status = 'activa' AND v.is_approved = true
       ORDER BY v.created_at DESC
       LIMIT 6`
    ),
    pool.query(
      `SELECT industria, COUNT(*)::int AS total
       FROM companies
       GROUP BY industria
       ORDER BY total DESC
       LIMIT 4`
    ),
  ]);

  return {
    totalVacantes: vacantes.rows[0].total,
    totalEmpresas: empresas.rows[0].total,
    vacantesRecientes: recientes.rows,
    topIndustrias: industrias.rows,
  };
};
```

---

## Task 2: Test TDD para `GET /api/public/stats`

**Files:**
- Create: `backend/src/tests/public.test.js`

- [ ] **Step 1: Escribir el test antes de la ruta**

```js
// backend/src/tests/public.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearEmpresa, crearVacante } from './helpers.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

describe('GET /api/public/stats', () => {
  test('devuelve estructura correcta con BD vacía', async () => {
    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalVacantes: 0,
      totalEmpresas: 0,
      vacantesRecientes: [],
      topIndustrias: [],
    });
  });

  test('totalVacantes solo cuenta activas y aprobadas', async () => {
    const { company } = await crearEmpresa();
    await crearVacante(company.id, { status: 'activa', isApproved: true });
    await crearVacante(company.id, { status: 'pausada', isApproved: true });
    await crearVacante(company.id, { status: 'activa', isApproved: false });

    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalVacantes).toBe(1);
  });

  test('vacantesRecientes incluye datos de empresa', async () => {
    const { company } = await crearEmpresa({ industria: 'Tecnología' });
    await crearVacante(company.id, { titulo: 'Dev Backend', status: 'activa', isApproved: true });

    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    expect(res.body.vacantesRecientes).toHaveLength(1);
    const v = res.body.vacantesRecientes[0];
    expect(v.titulo).toBe('Dev Backend');
    expect(v.empresa_nombre).toBeDefined();
  });

  test('topIndustrias devuelve máximo 4 industrias ordenadas por frecuencia', async () => {
    await crearEmpresa({ industria: 'Tech' });
    await crearEmpresa({ industria: 'Tech' });
    await crearEmpresa({ industria: 'Salud' });
    await crearEmpresa({ industria: 'Educación' });
    await crearEmpresa({ industria: 'Finanzas' });
    await crearEmpresa({ industria: 'Retail' });

    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    expect(res.body.topIndustrias.length).toBeLessThanOrEqual(4);
    expect(res.body.topIndustrias[0].industria).toBe('Tech');
    expect(res.body.topIndustrias[0].total).toBe(2);
  });

  test('no requiere autenticación', async () => {
    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Ejecutar test — debe fallar (ruta no existe aún)**

```bash
cd backend && npm test -- --testPathPattern=public --runInBand
```

Expected: FAIL con `404` o `Cannot GET /api/public/stats`

---

## Task 3: Ruta pública y registro en app.js

**Files:**
- Create: `backend/src/routes/public.routes.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Crear la ruta**

```js
// backend/src/routes/public.routes.js
import { Router } from 'express';
import { getLandingStats } from '../services/public.service.js';

const router = Router();

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getLandingStats();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
```

- [ ] **Step 2: Registrar en app.js**

En `backend/src/app.js`, agregar import y `app.use` **antes** de las rutas de API existentes:

```js
// Agregar este import junto a los otros
import publicRoutes from './routes/public.routes.js';

// Agregar esta línea antes de app.use('/api/auth', ...)
app.use('/api/public', publicRoutes);
```

- [ ] **Step 3: Correr tests — deben pasar**

```bash
cd backend && npm test -- --testPathPattern=public --runInBand
```

Expected: PASS 5 tests

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/public.service.js \
        backend/src/routes/public.routes.js \
        backend/src/tests/public.test.js \
        backend/src/app.js
git commit -m "feat(api): add GET /api/public/stats endpoint for landing page"
```

---

## Task 4: Generar logo con NanoBanana MCP

**Files:**
- Create: `frontend/img/logo-nanobanana.png`

- [ ] **Step 1: Generar imagen con MCP nanobanana**

Usar `mcp__nanobanana__generate_image` con prompt:

```
Professional tech startup logo for "IntegraJobs" — a job portal platform.
Design: modern minimal wordmark with a small briefcase or connection icon.
Primary color #1A56DB (electric blue), accent #10B981 (emerald green).
Clean white background. High contrast. Suitable for navbar use.
Style: SaaS / LinkedIn-inspired. No gradients, flat design.
"powered by NanoBanana" in tiny grey text at the bottom.
Output: transparent PNG, rectangular, ~320x80px proportions.
```

- [ ] **Step 2: Guardar resultado**

Guardar el PNG generado como `frontend/img/logo-nanobanana.png`

- [ ] **Step 3: Verificar que el archivo existe**

```bash
ls -lh frontend/img/logo-nanobanana.png
```

---

## Task 5: Refactor `frontend/index.html`

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Reemplazar contenido completo**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IntegraJobs — Tu próximo empleo comienza aquí</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body>

  <!-- ── NAV ── -->
  <nav class="ij-public-nav">
    <a href="/" class="ij-brand">
      <img src="/img/logo-nanobanana.png" alt="IntegraJobs" style="height:2rem;width:auto" onerror="this.style.display='none';document.getElementById('nav-fallback').style.display='flex'">
      <span class="ij-flex ij-items-center ij-gap-2" id="nav-fallback" style="display:none">
        <span class="ij-brand-icon" id="nav-icon"></span>
        <span class="ij-brand-name">IntegraJobs</span>
      </span>
    </a>
    <ul>
      <li><a href="/">Inicio</a></li>
      <li><a href="/pages/login.html">Empleos</a></li>
      <li><a href="/pages/login.html?type=empresa">Empresas</a></li>
      <li><a href="/pages/registro-candidato.html">Candidatos</a></li>
    </ul>
    <div class="ij-flex ij-gap-2">
      <a href="/pages/login.html" class="ij-btn ij-btn-ghost ij-btn-sm">Iniciar sesión</a>
      <a href="/pages/registro.html" class="ij-btn ij-btn-primary ij-btn-sm">Registrarse gratis</a>
    </div>
  </nav>

  <!-- ── HERO ── -->
  <section class="ij-hero">
    <div class="ij-container" style="position:relative;text-align:center">
      <span class="ij-badge" style="background:rgba(255,255,255,.15);color:#fff;margin-bottom:1.25rem">
        N.° 1 Portal de Empleo en El Salvador
      </span>
      <h1 style="font-size:clamp(2rem,5vw,3.25rem);line-height:1.15;margin-bottom:1rem">
        Tu carrera <em>empieza aquí</em>
      </h1>
      <p class="lead" style="max-width:36rem;margin:0 auto 2rem">
        Conectamos talento salvadoreño con las mejores empresas. Miles de vacantes reales, actualizadas cada día.
      </p>
      <form class="ij-hero-search" id="heroSearch">
        <input type="text" name="q" placeholder="Cargo, empresa o habilidad..." aria-label="Buscar empleo" style="flex:2;min-width:0">
        <input type="text" name="ubicacion" placeholder="Ubicación..." aria-label="Ubicación" style="flex:1;min-width:0;border-left:1px solid rgba(255,255,255,.2)">
        <button type="submit">Buscar</button>
      </form>
      <div id="heroIndustrias" class="ij-flex ij-gap-2 ij-justify-center" style="margin-top:1.25rem;flex-wrap:wrap;min-height:1.75rem">
        <!-- Renderizado dinámico desde JS -->
      </div>
      <div class="ij-flex ij-gap-3 ij-justify-center" style="margin-top:2rem;flex-wrap:wrap">
        <a href="/pages/login.html" class="ij-btn ij-btn-lg" style="background:#fff;color:var(--color-primary)">Explorar empleos</a>
        <a href="/pages/login.html?type=empresa" class="ij-btn ij-btn-lg" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)">Publicar vacante</a>
      </div>
    </div>
  </section>

  <!-- ── STATS ── -->
  <section class="ij-section" style="padding:3rem 1.5rem">
    <div class="ij-stats-grid">
      <div class="ij-stat-card">
        <div class="ij-stat-value" id="statVacantes">—</div>
        <div class="ij-text-sm ij-font-semibold">Vacantes activas</div>
        <div class="ij-text-xs ij-text-muted-2 ij-mt-1">actualizadas diario</div>
      </div>
      <div class="ij-stat-card">
        <div class="ij-stat-value" id="statEmpresas">—</div>
        <div class="ij-text-sm ij-font-semibold">Empresas registradas</div>
        <div class="ij-text-xs ij-text-muted-2 ij-mt-1">verificadas</div>
      </div>
      <div class="ij-stat-card">
        <div class="ij-stat-value">95%</div>
        <div class="ij-text-sm ij-font-semibold">Tasa de éxito</div>
        <div class="ij-text-xs ij-text-muted-2 ij-mt-1">de colocación</div>
      </div>
      <div class="ij-stat-card">
        <div class="ij-stat-value">48h</div>
        <div class="ij-text-sm ij-font-semibold">Tiempo medio</div>
        <div class="ij-text-xs ij-text-muted-2 ij-mt-1">primera respuesta</div>
      </div>
    </div>
  </section>

  <!-- ── FEATURED JOBS ── -->
  <section class="ij-section" style="padding-top:1rem;padding-bottom:3rem">
    <div class="ij-container">
      <div class="ij-flex ij-justify-between ij-items-center ij-mb-4">
        <div>
          <div class="ij-eyebrow">Oportunidades</div>
          <h2>Empleos destacados</h2>
        </div>
        <a href="/pages/login.html" class="ij-btn ij-btn-ghost ij-btn-sm">Ver todos →</a>
      </div>
      <div class="ij-grid ij-grid-cols-3 ij-gap-4" id="featuredJobs">
        <!-- Skeletons iniciales -->
        <div class="ij-job-card ij-skeleton-card" aria-hidden="true"></div>
        <div class="ij-job-card ij-skeleton-card" aria-hidden="true"></div>
        <div class="ij-job-card ij-skeleton-card" aria-hidden="true"></div>
      </div>
    </div>
  </section>

  <!-- ── BENEFITS ── -->
  <section class="ij-section" style="background:var(--color-slate-50);padding:4rem 1.5rem">
    <div class="ij-container">
      <div style="text-align:center;margin-bottom:2.5rem">
        <div class="ij-eyebrow">¿Por qué IntegraJobs?</div>
        <h2>Una plataforma, dos mundos de posibilidades</h2>
      </div>
      <div class="ij-grid ij-grid-cols-2 ij-gap-6">
        <!-- Candidatos -->
        <div class="ij-card" style="padding:2rem">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem">
            <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius);background:var(--color-primary-10);display:flex;align-items:center;justify-content:center" id="benefit-icon-1"></div>
            <h3 style="font-size:1.125rem">Para Candidatos</h3>
          </div>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.875rem">
            <li class="ij-flex ij-gap-3 ij-items-start">
              <span style="color:var(--color-secondary);font-size:1rem;margin-top:.1rem">✓</span>
              <span class="ij-text-sm">Accede a miles de vacantes activas sin costo</span>
            </li>
            <li class="ij-flex ij-gap-3 ij-items-start">
              <span style="color:var(--color-secondary);font-size:1rem;margin-top:.1rem">✓</span>
              <span class="ij-text-sm">Crea alertas personalizadas y recibe notificaciones</span>
            </li>
            <li class="ij-flex ij-gap-3 ij-items-start">
              <span style="color:var(--color-secondary);font-size:1rem;margin-top:.1rem">✓</span>
              <span class="ij-text-sm">Postula con un clic y rastrea tus solicitudes</span>
            </li>
            <li class="ij-flex ij-gap-3 ij-items-start">
              <span style="color:var(--color-secondary);font-size:1rem;margin-top:.1rem">✓</span>
              <span class="ij-text-sm">Accede al foro comunitario y recursos de carrera</span>
            </li>
          </ul>
          <a href="/pages/registro-candidato.html" class="ij-btn ij-btn-primary" style="margin-top:1.75rem;width:100%;justify-content:center">
            Buscar empleo gratis
          </a>
        </div>
        <!-- Empresas -->
        <div class="ij-card" style="padding:2rem;border-color:var(--color-secondary);border-width:2px">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem">
            <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius);background:rgba(16,185,129,.1);display:flex;align-items:center;justify-content:center" id="benefit-icon-2"></div>
            <h3 style="font-size:1.125rem">Para Empresas</h3>
          </div>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.875rem">
            <li class="ij-flex ij-gap-3 ij-items-start">
              <span style="color:var(--color-secondary);font-size:1rem;margin-top:.1rem">✓</span>
              <span class="ij-text-sm">Publica vacantes y llega a miles de candidatos</span>
            </li>
            <li class="ij-flex ij-gap-3 ij-items-start">
              <span style="color:var(--color-secondary);font-size:1rem;margin-top:.1rem">✓</span>
              <span class="ij-text-sm">Gestiona postulaciones desde un panel centralizado</span>
            </li>
            <li class="ij-flex ij-gap-3 ij-items-start">
              <span style="color:var(--color-secondary);font-size:1rem;margin-top:.1rem">✓</span>
              <span class="ij-text-sm">Obtén el sello de empresa verificada y genera confianza</span>
            </li>
            <li class="ij-flex ij-gap-3 ij-items-start">
              <span style="color:var(--color-secondary);font-size:1rem;margin-top:.1rem">✓</span>
              <span class="ij-text-sm">Accede a estadísticas y métricas de tus vacantes</span>
            </li>
          </ul>
          <a href="/pages/login.html?type=empresa" class="ij-btn" style="margin-top:1.75rem;width:100%;justify-content:center;background:var(--color-secondary);color:#fff">
            Publicar vacante
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- ── CTA FINAL ── -->
  <section class="ij-section" style="background:linear-gradient(135deg,#0f172a,#0f2d6b 60%,var(--color-primary));color:#fff;text-align:center;padding:4rem 1.5rem">
    <div class="ij-container">
      <div class="ij-eyebrow" style="color:var(--color-secondary)">Empieza hoy</div>
      <h2 style="color:#fff;font-size:clamp(1.5rem,4vw,2.25rem);margin-bottom:.75rem">
        ¿Listo para dar el siguiente paso?
      </h2>
      <p style="color:#cbd5e1;max-width:32rem;margin:0 auto 2rem">
        Únete a miles de profesionales y empresas que ya confían en IntegraJobs para conectar talento con oportunidades reales.
      </p>
      <div class="ij-flex ij-gap-3 ij-justify-center" style="flex-wrap:wrap">
        <a href="/pages/registro-candidato.html" class="ij-btn ij-btn-lg ij-btn-secondary">Crear cuenta gratis</a>
        <a href="/pages/login.html?type=empresa" class="ij-btn ij-btn-lg" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.3)">
          Publicar vacante →
        </a>
      </div>
    </div>
  </section>

  <!-- ── FOOTER ── -->
  <footer style="background:#020617;color:#94a3b8;padding:3rem 1.5rem 2rem">
    <div class="ij-container ij-flex ij-justify-between ij-items-center" style="flex-wrap:wrap;gap:1rem">
      <div class="ij-flex ij-items-center ij-gap-2">
        <img src="/img/logo-nanobanana.png" alt="IntegraJobs" style="height:1.5rem;width:auto;opacity:.85" onerror="this.style.display='none'">
        <strong style="color:#fff" id="footer-brand-fallback">IntegraJobs</strong>
      </div>
      <span class="ij-text-xs" style="color:#475569">© 2026 IntegraJobs. Hecho en El Salvador.</span>
    </div>
  </footer>

  <script type="module">
    import { renderIcon } from '/js/icons.js';
    document.getElementById('nav-icon').innerHTML       = renderIcon('briefcase');
    document.getElementById('benefit-icon-1').innerHTML = renderIcon('user');
    document.getElementById('benefit-icon-2').innerHTML = renderIcon('building');
  </script>
  <script type="module" src="/js/index.js"></script>
</body>
</html>
```

---

## Task 6: Refactor `frontend/js/index.js`

**Files:**
- Modify: `frontend/js/index.js`

- [ ] **Step 1: Reemplazar contenido completo**

```js
// frontend/js/index.js
import { formatSalario, modalidadLabel, badgeForModalidad, timeAgo, escapeHtml, initials } from '/js/helpers.js';

// ── DOM refs ──────────────────────────────────────────────────────────
const container     = document.getElementById('featuredJobs');
const statVacantes  = document.getElementById('statVacantes');
const statEmpresas  = document.getElementById('statEmpresas');
const heroIndustrias = document.getElementById('heroIndustrias');

// ── Hero search ───────────────────────────────────────────────────────
document.getElementById('heroSearch').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const q        = fd.get('q')?.trim();
  const ubicacion = fd.get('ubicacion')?.trim();
  const params = new URLSearchParams();
  if (q)        params.set('q', q);
  if (ubicacion) params.set('ubicacion', ubicacion);
  const qs = params.toString();
  window.location.href = '/pages/login.html' + (qs ? `?${qs}` : '');
});

// ── JobCard ───────────────────────────────────────────────────────────
const logoFallback = (nombre) =>
  `<div class="ij-job-logo" style="background:var(--color-primary-15);color:var(--color-primary);font-weight:700;font-size:.875rem">${initials(nombre)}</div>`;

const logoImg = (url, nombre) =>
  url
    ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(nombre)}" class="ij-job-logo" style="object-fit:contain;padding:.25rem" onerror="this.outerHTML='${logoFallback(nombre).replace(/'/g, "\\'")}'"/>`
    : logoFallback(nombre);

const renderCard = (v) => `
  <a href="/pages/login.html" class="ij-job-card">
    <div class="ij-flex ij-items-start ij-gap-3 ij-mb-3">
      ${logoImg(v.empresa_logo, v.empresa_nombre)}
      <div style="min-width:0;flex:1">
        <div class="ij-font-semibold ij-truncate">${escapeHtml(v.titulo)}</div>
        <div class="ij-text-xs ij-text-muted-2">${escapeHtml(v.empresa_nombre ?? 'Empresa')}</div>
      </div>
    </div>
    <div class="ij-flex ij-items-center ij-gap-2" style="flex-wrap:wrap;margin-bottom:.75rem">
      <span class="ij-text-xs ij-text-muted">📍 ${escapeHtml(v.ubicacion)}</span>
      <span class="ij-badge ${badgeForModalidad(v.tipo_trabajo)}">${modalidadLabel(v.tipo_trabajo)}</span>
    </div>
    <div class="ij-text-xs ij-font-semibold" style="color:var(--color-secondary);margin-bottom:.5rem">
      ${formatSalario(v.salario_min, v.salario_max)}
    </div>
    <div class="ij-flex ij-items-center ij-justify-between ij-mt-2">
      <span class="ij-text-xs ij-text-muted-2">${timeAgo(v.created_at)}</span>
      <span class="ij-text-xs ij-font-semibold ij-text-primary">Ver detalle →</span>
    </div>
  </a>
`;

// ── Skeleton cards ────────────────────────────────────────────────────
const skeletonCard = () => `
  <div class="ij-job-card" style="pointer-events:none;animation:ij-pulse 1.5s ease-in-out infinite">
    <div style="display:flex;gap:.75rem;margin-bottom:.75rem">
      <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius);background:var(--color-border-2);flex-shrink:0"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:.5rem">
        <div style="height:.875rem;border-radius:var(--radius-sm);background:var(--color-border-2);width:70%"></div>
        <div style="height:.75rem;border-radius:var(--radius-sm);background:var(--color-border-2);width:45%"></div>
      </div>
    </div>
    <div style="height:.75rem;border-radius:var(--radius-sm);background:var(--color-border-2);width:55%;margin-bottom:.5rem"></div>
    <div style="height:.75rem;border-radius:var(--radius-sm);background:var(--color-border-2);width:40%"></div>
  </div>
`;

// ── Fetch & render ────────────────────────────────────────────────────
container.innerHTML = [1,2,3].map(skeletonCard).join('');

(async () => {
  try {
    const res = await fetch('/api/public/stats');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { totalVacantes, totalEmpresas, vacantesRecientes, topIndustrias } = await res.json();

    // Stats
    statVacantes.textContent = totalVacantes > 0 ? `+${totalVacantes.toLocaleString()}` : '0';
    statEmpresas.textContent = totalEmpresas > 0 ? `+${totalEmpresas.toLocaleString()}` : '0';

    // Industrias hero badges
    if (topIndustrias.length) {
      heroIndustrias.innerHTML = topIndustrias
        .map(i => `<a href="/pages/login.html?industria=${encodeURIComponent(i.industria)}" class="ij-badge" style="background:rgba(255,255,255,.15);color:#fff;cursor:pointer">${escapeHtml(i.industria)}</a>`)
        .join('');
    }

    // Vacantes
    container.innerHTML = vacantesRecientes.length
      ? vacantesRecientes.map(renderCard).join('')
      : '<p class="ij-text-muted" style="grid-column:1/-1;text-align:center;padding:2rem 0">No hay vacantes disponibles aún.</p>';

  } catch {
    container.innerHTML = '<p class="ij-text-danger" style="grid-column:1/-1;text-align:center;padding:2rem 0">Error al cargar vacantes. Intenta más tarde.</p>';
  }
})();
```

- [ ] **Step 2: Commit frontend**

```bash
git add frontend/index.html frontend/js/index.js
git commit -m "feat(landing): refactor PUB-01 with real data, skeleton loaders, dual search"
```

---

## Task 7: Agregar animación skeleton en theme.css

**Files:**
- Modify: `frontend/css/theme.css`

- [ ] **Step 1: Agregar keyframe al final del archivo**

```css
/* ── Skeleton loader animation ── */
@keyframes ij-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .45; }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/theme.css
git commit -m "feat(css): add ij-pulse skeleton animation for landing loaders"
```

---

## Self-Review

- ✅ `GET /api/public/stats` — cubierto en Tasks 1–3
- ✅ Tests TDD completos con 5 casos — Task 2
- ✅ Logo NanoBanana — Task 4
- ✅ Hero con búsqueda dual (keyword + ubicación) — Tasks 5–6
- ✅ Stats dinámicos (totalVacantes, totalEmpresas) — Tasks 5–6
- ✅ JobCard con logo, salario formateado, badge modalidad, timeAgo — Task 6
- ✅ Skeleton loaders — Tasks 5–6
- ✅ Fallback logo empresa (initials) — Task 6
- ✅ Top 4 industrias como badges en hero — Tasks 5–6
- ✅ Benefits section (candidatos vs empresas) — Task 5
- ✅ CTA dual final — Task 5
- ✅ Animación CSS skeleton — Task 7
- ✅ Sin Tailwind, solo clases `ij-*` — verificado en todo el HTML
- ✅ Mobile First — usa `clamp()` y `flex-wrap` en todos los layouts
