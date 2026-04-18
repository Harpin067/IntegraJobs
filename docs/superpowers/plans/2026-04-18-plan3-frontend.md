# Migración Portal — Plan 3: Frontend Bootstrap + Vanilla JS

> **Para agentes:** SUB-SKILL REQUERIDO: Usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para seguimiento.

**Goal:** Construir las páginas HTML + JS del portal de empleo usando Bootstrap 5 y vanilla ES Modules, conectadas al REST API de Express.

**Architecture:** Cada página HTML carga su propio módulo JS con `<script type="module">`. Los módulos importan `apiFetch` desde `/js/api.js` y helpers de auth desde `/js/auth.js`. No hay framework ni bundler — el servidor Express sirve `frontend/` como estático.

**Tech Stack:** Bootstrap 5.3 (CDN), vanilla JS ES Modules, HTML5. Backend: Express 5 sirviendo `/` desde `frontend/`. Tests: verificación de sintaxis con `node --check` + `npm test` para confirmar que backend sigue verde.

---

## Mapa de archivos

```
frontend/
├── index.html                          MODIFICAR — añadir <script type="module" src="/js/index.js">
├── js/
│   ├── index.js                        CREAR — carga vacantes recientes en landing
│   └── pages/
│       ├── login.js                    CREAR
│       ├── registro-candidato.js       CREAR
│       ├── registro-empresa.js         CREAR
│       ├── candidato/
│       │   └── dashboard.js            CREAR
│       ├── empresa/
│       │   ├── dashboard.js            CREAR
│       │   └── crear-vacante.js        CREAR
│       └── admin/
│           └── dashboard.js            CREAR
└── pages/
    ├── login.html                      CREAR
    ├── registro.html                   CREAR (selector candidato/empresa)
    ├── registro-candidato.html         CREAR
    ├── registro-empresa.html           CREAR
    ├── candidato/
    │   └── dashboard.html              CREAR
    ├── empresa/
    │   ├── dashboard.html              CREAR
    │   └── crear-vacante.html          CREAR
    └── admin/
        └── dashboard.html              CREAR
```

**Convenciones de importación:** todos los módulos JS usan rutas absolutas (`/js/api.js`, `/js/auth.js`) para no depender de la profundidad de la página.

**Patrón de navbar:** cada HTML tiene su propia navbar estática con Bootstrap. No hay componente compartido (YAGNI — son 8 páginas, no 80).

**Error handling en JS:** cada fetch envuelto en try/catch; errores se muestran en un `<div id="alert">` con clase `alert-danger`.

---

## Tarea 1: Landing page — vacantes recientes

**Files:**
- Modificar: `frontend/index.html`
- Crear: `frontend/js/index.js`

- [ ] **Paso 1.1: Crear `frontend/js/index.js`**

```js
// frontend/js/index.js
import { apiFetch } from '/js/api.js';

const container = document.getElementById('vacantes-recientes');

const badge = (tipo) => {
  const colors = { remoto: 'success', presencial: 'primary', hibrido: 'info' };
  return `<span class="badge bg-${colors[tipo] ?? 'secondary'}">${tipo}</span>`;
};

const renderVacante = (v) => `
  <div class="col-md-4">
    <div class="card h-100 shadow-sm border-0">
      <div class="card-body">
        ${badge(v.tipo_trabajo)}
        <h5 class="card-title mt-2 mb-1">${v.titulo}</h5>
        <p class="text-muted small mb-1">${v.empresa_nombre}</p>
        <p class="text-muted small mb-0">${v.ubicacion}</p>
      </div>
      <div class="card-footer bg-transparent border-0 pt-0">
        <a href="/pages/login.html" class="btn btn-outline-primary btn-sm">Ver detalle</a>
      </div>
    </div>
  </div>
`;

(async () => {
  try {
    const { data } = await apiFetch('/vacantes?limit=6');
    container.innerHTML = data.length
      ? data.map(renderVacante).join('')
      : '<p class="text-muted text-center col-12">No hay vacantes disponibles aún.</p>';
  } catch {
    container.innerHTML = '<p class="text-danger text-center col-12">Error al cargar vacantes.</p>';
  }
})();
```

- [ ] **Paso 1.2: Añadir script a `frontend/index.html`**

Añade esta línea antes del cierre `</body>`, después del script de Bootstrap:

```html
  <script type="module" src="/js/index.js"></script>
```

El `index.html` final queda:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body>
  <nav class="navbar navbar-expand-lg" style="background-color: var(--color-primary);">
    <div class="container">
      <a class="navbar-brand text-white fw-bold" href="/">Portal de Empleo</a>
      <div class="ms-auto">
        <a href="/pages/login.html" class="btn btn-outline-light me-2">Iniciar sesión</a>
        <a href="/pages/registro.html" class="btn btn-light">Registrarse</a>
      </div>
    </div>
  </nav>

  <main class="container py-5">
    <div class="text-center mb-5">
      <h1 class="fw-bold">Encuentra tu próximo empleo</h1>
      <p class="text-muted fs-5">Miles de oportunidades te esperan</p>
      <a href="/pages/login.html" class="btn btn-primary btn-lg">Comenzar</a>
    </div>
    <div id="vacantes-recientes" class="row g-4">
      <p class="text-muted text-center col-12">Cargando vacantes...</p>
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="/js/index.js"></script>
</body>
</html>
```

- [ ] **Paso 1.3: Verificar sintaxis JS**

```bash
node --check /home/stephen/Documentos/Portal/frontend/js/index.js
```

Salida esperada: sin output (sin errores).

- [ ] **Paso 1.4: Verificar backend tests siguen verdes**

```bash
cd /home/stephen/Documentos/Portal/backend && npm test 2>&1 | tail -5
```

Salida esperada: `Tests: 38 passed`.

- [ ] **Paso 1.5: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add frontend/index.html frontend/js/index.js
git commit -m "feat: cargar vacantes recientes en landing page"
```

---

## Tarea 2: Páginas de autenticación

**Files:**
- Crear: `frontend/pages/login.html`
- Crear: `frontend/js/pages/login.js`
- Crear: `frontend/pages/registro.html`
- Crear: `frontend/pages/registro-candidato.html`
- Crear: `frontend/js/pages/registro-candidato.js`
- Crear: `frontend/pages/registro-empresa.html`
- Crear: `frontend/js/pages/registro-empresa.js`

- [ ] **Paso 2.1: Crear `frontend/pages/login.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Iniciar sesión — Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body class="d-flex align-items-center min-vh-100" style="background-color: var(--color-background);">
  <div class="container" style="max-width: 420px;">
    <div class="text-center mb-4">
      <a href="/" class="text-decoration-none">
        <h4 class="fw-bold" style="color: var(--color-primary);">Portal de Empleo</h4>
      </a>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-4">
        <h5 class="card-title text-center mb-3">Iniciar sesión</h5>

        <ul class="nav nav-tabs mb-3" id="loginTabs">
          <li class="nav-item flex-fill text-center">
            <button class="nav-link active w-100" data-type="candidato">Candidato</button>
          </li>
          <li class="nav-item flex-fill text-center">
            <button class="nav-link w-100" data-type="empresa">Empresa</button>
          </li>
          <li class="nav-item flex-fill text-center">
            <button class="nav-link w-100" data-type="admin">Admin</button>
          </li>
        </ul>

        <div id="alert" class="alert alert-danger d-none"></div>

        <form id="loginForm">
          <div class="mb-3">
            <label class="form-label">Correo electrónico</label>
            <input type="email" id="email" class="form-control" required autocomplete="email">
          </div>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input type="password" id="password" class="form-control" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary w-100" id="btnSubmit">
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>

    <p class="text-center mt-3 text-muted small">
      ¿No tienes cuenta?
      <a href="/pages/registro.html">Regístrate</a>
    </p>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="/js/pages/login.js"></script>
</body>
</html>
```

- [ ] **Paso 2.2: Crear `frontend/js/pages/login.js`**

```js
// frontend/js/pages/login.js
import { login, getUser, redirectByRole } from '/js/auth.js';

// Si ya está logueado, redirigir
const existing = getUser();
if (existing) redirectByRole(existing.role);

let loginType = 'candidato';

const alert = document.getElementById('alert');
const btnSubmit = document.getElementById('btnSubmit');

const showError = (msg) => {
  alert.textContent = msg;
  alert.classList.remove('d-none');
};

// Tabs de tipo de login
document.getElementById('loginTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-type]');
  if (!btn) return;
  loginType = btn.dataset.type;
  document.querySelectorAll('#loginTabs .nav-link').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  alert.classList.add('d-none');
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alert.classList.add('d-none');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Entrando...';

  try {
    const user = await login(
      document.getElementById('email').value.trim(),
      document.getElementById('password').value,
      loginType
    );
    redirectByRole(user.role);
  } catch (err) {
    showError(err.message ?? 'Error al iniciar sesión');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Iniciar sesión';
  }
});
```

- [ ] **Paso 2.3: Crear `frontend/pages/registro.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Registrarse — Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body class="d-flex align-items-center min-vh-100" style="background-color: var(--color-background);">
  <div class="container" style="max-width: 480px;">
    <div class="text-center mb-4">
      <a href="/" class="text-decoration-none">
        <h4 class="fw-bold" style="color: var(--color-primary);">Portal de Empleo</h4>
      </a>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-4">
        <h5 class="card-title text-center mb-1">Crear cuenta</h5>
        <p class="text-muted text-center small mb-4">¿Qué tipo de cuenta necesitas?</p>

        <div class="d-grid gap-3">
          <a href="/pages/registro-candidato.html" class="btn btn-primary btn-lg">
            Soy candidato — busco empleo
          </a>
          <a href="/pages/registro-empresa.html" class="btn btn-outline-primary btn-lg">
            Soy empresa — quiero contratar
          </a>
        </div>
      </div>
    </div>

    <p class="text-center mt-3 text-muted small">
      ¿Ya tienes cuenta?
      <a href="/pages/login.html">Inicia sesión</a>
    </p>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

- [ ] **Paso 2.4: Crear `frontend/pages/registro-candidato.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Registro Candidato — Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body class="d-flex align-items-center min-vh-100" style="background-color: var(--color-background);">
  <div class="container" style="max-width: 460px;">
    <div class="text-center mb-4">
      <a href="/" class="text-decoration-none">
        <h4 class="fw-bold" style="color: var(--color-primary);">Portal de Empleo</h4>
      </a>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-4">
        <h5 class="card-title text-center mb-4">Registro — Candidato</h5>

        <div id="alert" class="alert alert-danger d-none"></div>
        <div id="success" class="alert alert-success d-none"></div>

        <form id="registroForm">
          <div class="row g-3">
            <div class="col-6">
              <label class="form-label">Nombre</label>
              <input type="text" id="nombre" class="form-control" required>
            </div>
            <div class="col-6">
              <label class="form-label">Apellidos</label>
              <input type="text" id="apellidos" class="form-control" required>
            </div>
          </div>
          <div class="mb-3 mt-3">
            <label class="form-label">Correo electrónico</label>
            <input type="email" id="email" class="form-control" required autocomplete="email">
          </div>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input type="password" id="password" class="form-control" required minlength="8" autocomplete="new-password">
            <div class="form-text">Mínimo 8 caracteres.</div>
          </div>
          <button type="submit" class="btn btn-primary w-100 mt-2" id="btnSubmit">
            Crear cuenta
          </button>
        </form>
      </div>
    </div>

    <p class="text-center mt-3 text-muted small">
      ¿Ya tienes cuenta? <a href="/pages/login.html">Inicia sesión</a>
    </p>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="/js/pages/registro-candidato.js"></script>
</body>
</html>
```

- [ ] **Paso 2.5: Crear `frontend/js/pages/registro-candidato.js`**

```js
// frontend/js/pages/registro-candidato.js
import { apiFetch } from '/js/api.js';
import { redirectByRole } from '/js/auth.js';

const alertEl   = document.getElementById('alert');
const successEl = document.getElementById('success');
const btnSubmit = document.getElementById('btnSubmit');

const showError = (msg) => {
  alertEl.textContent = msg;
  alertEl.classList.remove('d-none');
  successEl.classList.add('d-none');
};

document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('d-none');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Creando cuenta...';

  try {
    const data = await apiFetch('/auth/registro/candidato', {
      method: 'POST',
      body: JSON.stringify({
        email:    document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        nombre:   document.getElementById('nombre').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
      }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    redirectByRole(data.user.role);
  } catch (err) {
    showError(err.message ?? 'Error al registrarse');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Crear cuenta';
  }
});
```

- [ ] **Paso 2.6: Crear `frontend/pages/registro-empresa.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Registro Empresa — Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body style="background-color: var(--color-background);">
  <div class="container py-5" style="max-width: 520px;">
    <div class="text-center mb-4">
      <a href="/" class="text-decoration-none">
        <h4 class="fw-bold" style="color: var(--color-primary);">Portal de Empleo</h4>
      </a>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-4">
        <h5 class="card-title text-center mb-4">Registro — Empresa</h5>

        <div id="alert" class="alert alert-danger d-none"></div>
        <div id="success" class="alert alert-success d-none"></div>

        <form id="registroForm">
          <h6 class="text-muted mb-3">Datos del administrador</h6>
          <div class="mb-3">
            <label class="form-label">Tu nombre completo</label>
            <input type="text" id="nombre" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Correo electrónico</label>
            <input type="email" id="email" class="form-control" required autocomplete="email">
          </div>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input type="password" id="password" class="form-control" required minlength="8" autocomplete="new-password">
          </div>

          <hr class="my-3">
          <h6 class="text-muted mb-3">Datos de la empresa</h6>

          <div class="mb-3">
            <label class="form-label">Nombre de la empresa</label>
            <input type="text" id="empresaNombre" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Descripción breve</label>
            <textarea id="descripcion" class="form-control" rows="3" required></textarea>
          </div>
          <div class="row g-3">
            <div class="col-6">
              <label class="form-label">Ubicación</label>
              <input type="text" id="ubicacion" class="form-control" required>
            </div>
            <div class="col-6">
              <label class="form-label">Industria</label>
              <input type="text" id="industria" class="form-control" required>
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-100 mt-4" id="btnSubmit">
            Registrar empresa
          </button>
        </form>
      </div>
    </div>

    <p class="text-center mt-3 text-muted small">
      ¿Ya tienes cuenta? <a href="/pages/login.html">Inicia sesión</a>
    </p>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="/js/pages/registro-empresa.js"></script>
</body>
</html>
```

- [ ] **Paso 2.7: Crear `frontend/js/pages/registro-empresa.js`**

```js
// frontend/js/pages/registro-empresa.js
import { apiFetch } from '/js/api.js';

const alertEl   = document.getElementById('alert');
const successEl = document.getElementById('success');
const btnSubmit = document.getElementById('btnSubmit');

const showError = (msg) => {
  alertEl.textContent = msg;
  alertEl.classList.remove('d-none');
  successEl.classList.add('d-none');
};

document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('d-none');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Registrando...';

  try {
    await apiFetch('/auth/registro/empresa', {
      method: 'POST',
      body: JSON.stringify({
        email:        document.getElementById('email').value.trim(),
        password:     document.getElementById('password').value,
        nombre:       document.getElementById('nombre').value.trim(),
        empresaNombre: document.getElementById('empresaNombre').value.trim(),
        descripcion:  document.getElementById('descripcion').value.trim(),
        ubicacion:    document.getElementById('ubicacion').value.trim(),
        industria:    document.getElementById('industria').value.trim(),
      }),
    });
    successEl.textContent = 'Empresa registrada. Tu cuenta está pendiente de verificación por el administrador. Te contactaremos pronto.';
    successEl.classList.remove('d-none');
    document.getElementById('registroForm').style.display = 'none';
  } catch (err) {
    showError(err.message ?? 'Error al registrar empresa');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Registrar empresa';
  }
});
```

- [ ] **Paso 2.8: Verificar sintaxis de los JS**

```bash
node --check /home/stephen/Documentos/Portal/frontend/js/pages/login.js
node --check /home/stephen/Documentos/Portal/frontend/js/pages/registro-candidato.js
node --check /home/stephen/Documentos/Portal/frontend/js/pages/registro-empresa.js
```

Sin output = sin errores de sintaxis.

- [ ] **Paso 2.9: Verificar backend tests**

```bash
cd /home/stephen/Documentos/Portal/backend && npm test 2>&1 | tail -5
```

Salida esperada: `Tests: 38 passed`.

- [ ] **Paso 2.10: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add frontend/pages/login.html \
        frontend/js/pages/login.js \
        frontend/pages/registro.html \
        frontend/pages/registro-candidato.html \
        frontend/js/pages/registro-candidato.js \
        frontend/pages/registro-empresa.html \
        frontend/js/pages/registro-empresa.js
git commit -m "feat: agregar páginas de autenticación (login, registro candidato y empresa)"
```

---

## Tarea 3: Dashboard candidato

**Files:**
- Crear: `frontend/pages/candidato/dashboard.html`
- Crear: `frontend/js/pages/candidato/dashboard.js`

- [ ] **Paso 3.1: Crear `frontend/pages/candidato/dashboard.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mi Dashboard — Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body style="background-color: var(--color-background);">
  <nav class="navbar navbar-expand-lg" style="background-color: var(--color-primary);">
    <div class="container">
      <a class="navbar-brand text-white fw-bold" href="/">Portal de Empleo</a>
      <div class="ms-auto d-flex align-items-center gap-3">
        <span class="text-white small" id="navNombre"></span>
        <button class="btn btn-outline-light btn-sm" id="btnLogout">Salir</button>
      </div>
    </div>
  </nav>

  <div class="container py-4">
    <div id="alert" class="alert alert-danger d-none"></div>

    <!-- Perfil -->
    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="card-title fw-bold mb-3">Mi perfil</h6>
            <div id="perfilInfo" class="text-muted small">Cargando...</div>
            <hr>
            <form id="perfilForm">
              <div class="mb-2">
                <label class="form-label form-label-sm">Teléfono</label>
                <input type="text" id="telefono" class="form-control form-control-sm">
              </div>
              <div class="mb-2">
                <label class="form-label form-label-sm">URL de tu CV</label>
                <input type="url" id="cvUrl" class="form-control form-control-sm" placeholder="https://...">
              </div>
              <button type="submit" class="btn btn-primary btn-sm w-100">Actualizar perfil</button>
            </form>
            <div id="perfilSuccess" class="alert alert-success mt-2 d-none p-2 small">Perfil actualizado.</div>
          </div>
        </div>
      </div>

      <!-- Vacantes disponibles -->
      <div class="col-md-8">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="card-title fw-bold mb-3">Vacantes disponibles</h6>
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <select id="filtroTipo" class="form-select form-select-sm">
                  <option value="">Tipo de trabajo</option>
                  <option value="remoto">Remoto</option>
                  <option value="presencial">Presencial</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>
              <div class="col-md-4">
                <select id="filtroExp" class="form-select form-select-sm">
                  <option value="">Experiencia</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <div class="col-md-4">
                <button class="btn btn-outline-primary btn-sm w-100" id="btnFiltrar">Filtrar</button>
              </div>
            </div>
            <div id="vacantesLista">Cargando vacantes...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mis postulaciones -->
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <h6 class="card-title fw-bold mb-3">Mis postulaciones</h6>
        <div id="postulacionesLista">Cargando...</div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="/js/pages/candidato/dashboard.js"></script>
</body>
</html>
```

- [ ] **Paso 3.2: Crear `frontend/js/pages/candidato/dashboard.js`**

```js
// frontend/js/pages/candidato/dashboard.js
import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

const user = requireAuth();
if (user?.role !== 'CANDIDATO') { window.location.href = '/pages/login.html'; }

document.getElementById('navNombre').textContent = user?.nombre ?? '';
document.getElementById('btnLogout').addEventListener('click', logout);

const alertEl = document.getElementById('alert');
const showError = (msg) => { alertEl.textContent = msg; alertEl.classList.remove('d-none'); };

// --- Perfil ---
const cargarPerfil = async () => {
  try {
    const p = await apiFetch('/candidato/perfil');
    document.getElementById('perfilInfo').innerHTML = `
      <p class="mb-1"><strong>${p.nombre} ${p.apellidos ?? ''}</strong></p>
      <p class="mb-1">${p.email}</p>
      ${p.telefono ? `<p class="mb-1">Tel: ${p.telefono}</p>` : ''}
      ${p.cv_url ? `<p class="mb-0"><a href="${p.cv_url}" target="_blank">Ver CV</a></p>` : ''}
    `;
    if (p.telefono) document.getElementById('telefono').value = p.telefono;
    if (p.cv_url)   document.getElementById('cvUrl').value = p.cv_url;
  } catch { showError('Error al cargar perfil'); }
};

document.getElementById('perfilForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/candidato/perfil', {
      method: 'PUT',
      body: JSON.stringify({
        telefono: document.getElementById('telefono').value.trim() || undefined,
        cvUrl:    document.getElementById('cvUrl').value.trim() || undefined,
      }),
    });
    document.getElementById('perfilSuccess').classList.remove('d-none');
    setTimeout(() => document.getElementById('perfilSuccess').classList.add('d-none'), 3000);
    cargarPerfil();
  } catch (err) { showError(err.message); }
});

// --- Vacantes ---
const statusBadge = { nuevo: 'secondary', en_proceso: 'primary', rechazado: 'danger', contratado: 'success' };

const renderVacante = (v) => `
  <div class="border rounded p-3 mb-2 d-flex justify-content-between align-items-start">
    <div>
      <strong>${v.titulo}</strong>
      <div class="text-muted small">${v.empresa_nombre} · ${v.ubicacion}</div>
      <span class="badge bg-primary small">${v.tipo_trabajo}</span>
      <span class="badge bg-secondary small">${v.experiencia}</span>
    </div>
    <button class="btn btn-sm btn-outline-success flex-shrink-0 ms-2" data-id="${v.id}">Postularme</button>
  </div>
`;

const cargarVacantes = async () => {
  const tipo = document.getElementById('filtroTipo').value;
  const exp  = document.getElementById('filtroExp').value;
  const qs   = new URLSearchParams();
  if (tipo) qs.set('tipo_trabajo', tipo);
  if (exp)  qs.set('experiencia', exp);

  try {
    const { data } = await apiFetch(`/vacantes?${qs}`);
    const lista = document.getElementById('vacantesLista');
    lista.innerHTML = data.length
      ? data.map(renderVacante).join('')
      : '<p class="text-muted small">No hay vacantes con esos filtros.</p>';

    lista.querySelectorAll('[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '...';
        try {
          await apiFetch(`/candidato/postulaciones/${btn.dataset.id}`, { method: 'POST', body: '{}' });
          btn.textContent = '✓ Enviada';
          btn.classList.replace('btn-outline-success', 'btn-success');
          cargarPostulaciones();
        } catch (err) {
          btn.textContent = err.status === 409 ? 'Ya aplicaste' : 'Error';
          btn.disabled = true;
        }
      });
    });
  } catch { showError('Error al cargar vacantes'); }
};

document.getElementById('btnFiltrar').addEventListener('click', cargarVacantes);

// --- Postulaciones ---
const cargarPostulaciones = async () => {
  try {
    const data = await apiFetch('/candidato/postulaciones');
    const lista = document.getElementById('postulacionesLista');
    lista.innerHTML = data.length
      ? data.map(p => `
          <div class="border rounded p-2 mb-2 d-flex justify-content-between align-items-center">
            <div>
              <strong>${p.vacante_titulo}</strong>
              <div class="text-muted small">${p.empresa_nombre}</div>
            </div>
            <span class="badge bg-${statusBadge[p.status] ?? 'secondary'}">${p.status.replace('_', ' ')}</span>
          </div>
        `).join('')
      : '<p class="text-muted small">Aún no te has postulado a ninguna vacante.</p>';
  } catch { showError('Error al cargar postulaciones'); }
};

cargarPerfil();
cargarVacantes();
cargarPostulaciones();
```

- [ ] **Paso 3.3: Verificar sintaxis**

```bash
node --check /home/stephen/Documentos/Portal/frontend/js/pages/candidato/dashboard.js
```

- [ ] **Paso 3.4: Verificar backend tests**

```bash
cd /home/stephen/Documentos/Portal/backend && npm test 2>&1 | tail -5
```

- [ ] **Paso 3.5: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add frontend/pages/candidato/dashboard.html frontend/js/pages/candidato/dashboard.js
git commit -m "feat: agregar dashboard candidato (perfil, vacantes, postulaciones)"
```

---

## Tarea 4: Dashboard empresa + crear vacante

**Files:**
- Crear: `frontend/pages/empresa/dashboard.html`
- Crear: `frontend/js/pages/empresa/dashboard.js`
- Crear: `frontend/pages/empresa/crear-vacante.html`
- Crear: `frontend/js/pages/empresa/crear-vacante.js`

- [ ] **Paso 4.1: Crear `frontend/pages/empresa/dashboard.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard Empresa — Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body style="background-color: var(--color-background);">
  <nav class="navbar navbar-expand-lg" style="background-color: var(--color-primary);">
    <div class="container">
      <a class="navbar-brand text-white fw-bold" href="/">Portal de Empleo</a>
      <div class="ms-auto d-flex align-items-center gap-3">
        <a href="/pages/empresa/crear-vacante.html" class="btn btn-light btn-sm">+ Nueva vacante</a>
        <span class="text-white small" id="navNombre"></span>
        <button class="btn btn-outline-light btn-sm" id="btnLogout">Salir</button>
      </div>
    </div>
  </nav>

  <div class="container py-4">
    <div id="alert" class="alert alert-danger d-none"></div>

    <!-- Perfil empresa -->
    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Perfil de empresa</h6>
            <div id="perfilInfo" class="text-muted small mb-3">Cargando...</div>
            <form id="perfilForm">
              <div class="mb-2">
                <label class="form-label form-label-sm">Descripción</label>
                <textarea id="descripcion" class="form-control form-control-sm" rows="3"></textarea>
              </div>
              <div class="mb-2">
                <label class="form-label form-label-sm">Sitio web</label>
                <input type="url" id="sitioWeb" class="form-control form-control-sm" placeholder="https://...">
              </div>
              <button type="submit" class="btn btn-primary btn-sm w-100">Actualizar</button>
            </form>
            <div id="perfilSuccess" class="alert alert-success mt-2 d-none p-2 small">Perfil actualizado.</div>
          </div>
        </div>
      </div>

      <!-- Mis vacantes -->
      <div class="col-md-8">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0">Mis vacantes</h6>
              <a href="/pages/empresa/crear-vacante.html" class="btn btn-sm btn-primary">+ Nueva</a>
            </div>
            <div id="vacantesLista">Cargando...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aplicaciones por vacante -->
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <h6 class="fw-bold mb-3">Aplicaciones — <span id="vacanteTituloActiva" class="text-muted">selecciona una vacante arriba</span></h6>
        <div id="aplicacionesLista">
          <p class="text-muted small">Haz clic en "Ver aplicaciones" en una vacante para mostrarlas aquí.</p>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="/js/pages/empresa/dashboard.js"></script>
</body>
</html>
```

- [ ] **Paso 4.2: Crear `frontend/js/pages/empresa/dashboard.js`**

```js
// frontend/js/pages/empresa/dashboard.js
import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

const user = requireAuth();
if (user?.role !== 'EMPRESA') { window.location.href = '/pages/login.html'; }

document.getElementById('navNombre').textContent = user?.nombre ?? '';
document.getElementById('btnLogout').addEventListener('click', logout);

const alertEl = document.getElementById('alert');
const showError = (msg) => { alertEl.textContent = msg; alertEl.classList.remove('d-none'); };

const APP_STATUS_LABELS = { nuevo: 'Nuevo', en_proceso: 'En proceso', rechazado: 'Rechazado', contratado: 'Contratado' };
const APP_STATUS_BADGE  = { nuevo: 'secondary', en_proceso: 'primary', rechazado: 'danger', contratado: 'success' };

// --- Perfil ---
const cargarPerfil = async () => {
  try {
    const p = await apiFetch('/empresa/perfil');
    document.getElementById('perfilInfo').innerHTML = `
      <p class="mb-1 fw-semibold">${p.nombre}</p>
      <p class="mb-1">${p.industria ?? ''} · ${p.ubicacion ?? ''}</p>
      <span class="badge ${p.is_verified ? 'bg-success' : 'bg-warning text-dark'}">
        ${p.is_verified ? 'Verificada' : 'Pendiente verificación'}
      </span>
    `;
    if (p.descripcion) document.getElementById('descripcion').value = p.descripcion;
    if (p.sitio_web)   document.getElementById('sitioWeb').value = p.sitio_web;
  } catch { showError('Error al cargar perfil'); }
};

document.getElementById('perfilForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/empresa/perfil', {
      method: 'PUT',
      body: JSON.stringify({
        descripcion: document.getElementById('descripcion').value.trim() || undefined,
        sitioWeb:    document.getElementById('sitioWeb').value.trim() || undefined,
      }),
    });
    document.getElementById('perfilSuccess').classList.remove('d-none');
    setTimeout(() => document.getElementById('perfilSuccess').classList.add('d-none'), 3000);
  } catch (err) { showError(err.message); }
});

// --- Vacantes ---
const vacantaStatusBadge = { activa: 'success', pausada: 'warning text-dark', cerrada: 'secondary' };

const cargarVacantes = async () => {
  try {
    const data = await apiFetch('/empresa/vacantes');
    const lista = document.getElementById('vacantesLista');
    lista.innerHTML = data.length
      ? data.map(v => `
          <div class="border rounded p-3 mb-2 d-flex justify-content-between align-items-start">
            <div>
              <strong>${v.titulo}</strong>
              <div class="text-muted small">${v.ubicacion} · ${v.tipo_trabajo}</div>
              <span class="badge bg-${vacantaStatusBadge[v.status] ?? 'secondary'} small">${v.status}</span>
              ${v.is_approved ? '' : '<span class="badge bg-warning text-dark small ms-1">Pendiente aprobación</span>'}
              <span class="text-muted small ms-2">${v.total_aplicaciones ?? 0} aplicación(es)</span>
            </div>
            <button class="btn btn-sm btn-outline-primary flex-shrink-0 ms-2" data-vacante-id="${v.id}" data-vacante-titulo="${v.titulo}">
              Ver aplicaciones
            </button>
          </div>
        `).join('')
      : '<p class="text-muted small">No tienes vacantes aún. <a href="/pages/empresa/crear-vacante.html">Crea una</a>.</p>';

    lista.querySelectorAll('[data-vacante-id]').forEach(btn => {
      btn.addEventListener('click', () => cargarAplicaciones(btn.dataset.vacanteId, btn.dataset.vacanteTitulo));
    });
  } catch { showError('Error al cargar vacantes'); }
};

// --- Aplicaciones ---
const cargarAplicaciones = async (vacancyId, titulo) => {
  document.getElementById('vacanteTituloActiva').textContent = titulo;
  try {
    const data = await apiFetch(`/empresa/vacantes/${vacancyId}/aplicaciones`);
    const lista = document.getElementById('aplicacionesLista');
    lista.innerHTML = data.length
      ? data.map(a => `
          <div class="border rounded p-3 mb-2 d-flex justify-content-between align-items-center">
            <div>
              <strong>${a.candidato_nombre}</strong>
              <div class="text-muted small">${a.candidato_email}</div>
              ${a.candidato_cv ? `<a href="${a.candidato_cv}" target="_blank" class="small">Ver CV</a>` : ''}
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-${APP_STATUS_BADGE[a.status] ?? 'secondary'}">${APP_STATUS_LABELS[a.status] ?? a.status}</span>
              <select class="form-select form-select-sm" style="width: auto;" data-app-id="${a.id}">
                ${Object.keys(APP_STATUS_LABELS).map(s => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${APP_STATUS_LABELS[s]}</option>`).join('')}
              </select>
            </div>
          </div>
        `).join('')
      : '<p class="text-muted small">No hay aplicaciones para esta vacante.</p>';

    lista.querySelectorAll('[data-app-id]').forEach(sel => {
      sel.addEventListener('change', async () => {
        try {
          await apiFetch(`/empresa/aplicaciones/${sel.dataset.appId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: sel.value }),
          });
          cargarAplicaciones(vacancyId, titulo);
        } catch (err) { showError(err.message); }
      });
    });
  } catch { showError('Error al cargar aplicaciones'); }
};

cargarPerfil();
cargarVacantes();
```

- [ ] **Paso 4.3: Crear `frontend/pages/empresa/crear-vacante.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nueva Vacante — Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body style="background-color: var(--color-background);">
  <nav class="navbar navbar-expand-lg" style="background-color: var(--color-primary);">
    <div class="container">
      <a class="navbar-brand text-white fw-bold" href="/">Portal de Empleo</a>
      <div class="ms-auto d-flex gap-2">
        <a href="/pages/empresa/dashboard.html" class="btn btn-outline-light btn-sm">← Volver</a>
        <button class="btn btn-outline-light btn-sm" id="btnLogout">Salir</button>
      </div>
    </div>
  </nav>

  <div class="container py-4" style="max-width: 640px;">
    <h5 class="fw-bold mb-4">Publicar nueva vacante</h5>

    <div id="alert" class="alert alert-danger d-none"></div>
    <div id="success" class="alert alert-success d-none"></div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <form id="vacanteForm">
          <div class="mb-3">
            <label class="form-label">Título del puesto <span class="text-danger">*</span></label>
            <input type="text" id="titulo" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Descripción <span class="text-danger">*</span></label>
            <textarea id="descripcion" class="form-control" rows="4" required></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Requisitos <span class="text-danger">*</span></label>
            <textarea id="requisitos" class="form-control" rows="3" required></textarea>
          </div>
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Ubicación <span class="text-danger">*</span></label>
              <input type="text" id="ubicacion" class="form-control" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Contacto <span class="text-danger">*</span></label>
              <input type="text" id="contacto" class="form-control" placeholder="email o teléfono" required>
            </div>
          </div>
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Tipo de trabajo</label>
              <select id="tipoTrabajo" class="form-select" required>
                <option value="remoto">Remoto</option>
                <option value="presencial">Presencial</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Tipo de contrato</label>
              <select id="tipoContrato" class="form-select" required>
                <option value="completo">Tiempo completo</option>
                <option value="medio">Medio tiempo</option>
                <option value="temporal">Temporal</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Experiencia</label>
              <select id="experiencia" class="form-select" required>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>
          </div>
          <div class="row g-3 mb-4">
            <div class="col-6">
              <label class="form-label">Salario mínimo (opcional)</label>
              <input type="number" id="salarioMin" class="form-control" min="0" step="100">
            </div>
            <div class="col-6">
              <label class="form-label">Salario máximo (opcional)</label>
              <input type="number" id="salarioMax" class="form-control" min="0" step="100">
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100" id="btnSubmit">
            Publicar vacante
          </button>
        </form>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="/js/pages/empresa/crear-vacante.js"></script>
</body>
</html>
```

- [ ] **Paso 4.4: Crear `frontend/js/pages/empresa/crear-vacante.js`**

```js
// frontend/js/pages/empresa/crear-vacante.js
import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

const user = requireAuth();
if (user?.role !== 'EMPRESA') { window.location.href = '/pages/login.html'; }

document.getElementById('btnLogout').addEventListener('click', logout);

const alertEl   = document.getElementById('alert');
const successEl = document.getElementById('success');
const btnSubmit = document.getElementById('btnSubmit');

const showError = (msg) => {
  alertEl.textContent = msg;
  alertEl.classList.remove('d-none');
  successEl.classList.add('d-none');
};

document.getElementById('vacanteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('d-none');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Publicando...';

  const salarioMin = document.getElementById('salarioMin').value;
  const salarioMax = document.getElementById('salarioMax').value;

  try {
    await apiFetch('/vacantes', {
      method: 'POST',
      body: JSON.stringify({
        titulo:       document.getElementById('titulo').value.trim(),
        descripcion:  document.getElementById('descripcion').value.trim(),
        requisitos:   document.getElementById('requisitos').value.trim(),
        ubicacion:    document.getElementById('ubicacion').value.trim(),
        contacto:     document.getElementById('contacto').value.trim(),
        tipoTrabajo:  document.getElementById('tipoTrabajo').value,
        tipoContrato: document.getElementById('tipoContrato').value,
        experiencia:  document.getElementById('experiencia').value,
        salarioMin:   salarioMin ? Number(salarioMin) : undefined,
        salarioMax:   salarioMax ? Number(salarioMax) : undefined,
      }),
    });
    successEl.innerHTML = 'Vacante publicada. Está pendiente de aprobación por el administrador. <a href="/pages/empresa/dashboard.html">Volver al dashboard</a>.';
    successEl.classList.remove('d-none');
    document.getElementById('vacanteForm').style.display = 'none';
  } catch (err) {
    showError(err.message ?? 'Error al publicar vacante');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Publicar vacante';
  }
});
```

- [ ] **Paso 4.5: Verificar sintaxis**

```bash
node --check /home/stephen/Documentos/Portal/frontend/js/pages/empresa/dashboard.js
node --check /home/stephen/Documentos/Portal/frontend/js/pages/empresa/crear-vacante.js
```

- [ ] **Paso 4.6: Verificar backend tests**

```bash
cd /home/stephen/Documentos/Portal/backend && npm test 2>&1 | tail -5
```

- [ ] **Paso 4.7: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add frontend/pages/empresa/dashboard.html \
        frontend/js/pages/empresa/dashboard.js \
        frontend/pages/empresa/crear-vacante.html \
        frontend/js/pages/empresa/crear-vacante.js
git commit -m "feat: agregar dashboard empresa y página crear vacante"
```

---

## Tarea 5: Dashboard admin

**Files:**
- Crear: `frontend/pages/admin/dashboard.html`
- Crear: `frontend/js/pages/admin/dashboard.js`

- [ ] **Paso 5.1: Crear `frontend/pages/admin/dashboard.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard Admin — Portal de Empleo</title>
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body style="background-color: var(--color-background);">
  <nav class="navbar navbar-expand-lg" style="background-color: var(--color-primary);">
    <div class="container">
      <a class="navbar-brand text-white fw-bold" href="/">Portal de Empleo</a>
      <div class="ms-auto d-flex align-items-center gap-3">
        <span class="text-white small">Admin</span>
        <button class="btn btn-outline-light btn-sm" id="btnLogout">Salir</button>
      </div>
    </div>
  </nav>

  <div class="container py-4">
    <div id="alert" class="alert alert-danger d-none"></div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4" id="adminTabs">
      <li class="nav-item">
        <button class="nav-link active" data-tab="usuarios">Usuarios</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" data-tab="empresas">Empresas pendientes</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" data-tab="vacantes">Vacantes pendientes</button>
      </li>
    </ul>

    <!-- Tab: Usuarios -->
    <div id="tab-usuarios">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h6 class="fw-bold mb-3">Todos los usuarios</h6>
          <div id="usuariosLista">Cargando...</div>
        </div>
      </div>
    </div>

    <!-- Tab: Empresas -->
    <div id="tab-empresas" class="d-none">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h6 class="fw-bold mb-3">Empresas pendientes de verificación</h6>
          <div id="empresasLista">Cargando...</div>
        </div>
      </div>
    </div>

    <!-- Tab: Vacantes -->
    <div id="tab-vacantes" class="d-none">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h6 class="fw-bold mb-3">Vacantes pendientes de aprobación</h6>
          <div id="vacantesLista">Cargando...</div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="/js/pages/admin/dashboard.js"></script>
</body>
</html>
```

- [ ] **Paso 5.2: Crear `frontend/js/pages/admin/dashboard.js`**

```js
// frontend/js/pages/admin/dashboard.js
import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

const user = requireAuth();
if (user?.role !== 'SUPERADMIN') { window.location.href = '/pages/login.html'; }

document.getElementById('btnLogout').addEventListener('click', logout);

const alertEl = document.getElementById('alert');
const showError = (msg) => { alertEl.textContent = msg; alertEl.classList.remove('d-none'); };

const roleBadge = { CANDIDATO: 'primary', EMPRESA: 'info', SUPERADMIN: 'dark' };

// --- Tabs ---
const tabs = { usuarios: null, empresas: null, vacantes: null };

document.getElementById('adminTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  const tab = btn.dataset.tab;

  document.querySelectorAll('#adminTabs .nav-link').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  Object.keys(tabs).forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('d-none', t !== tab);
  });

  if (tab === 'usuarios' && !tabs.usuarios) cargarUsuarios();
  if (tab === 'empresas' && !tabs.empresas) cargarEmpresas();
  if (tab === 'vacantes' && !tabs.vacantes) cargarVacantes();
});

// --- Usuarios ---
const cargarUsuarios = async () => {
  tabs.usuarios = true;
  try {
    const data = await apiFetch('/admin/usuarios');
    const lista = document.getElementById('usuariosLista');
    lista.innerHTML = data.length
      ? `<table class="table table-sm table-hover">
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            ${data.map(u => `
              <tr>
                <td>${u.nombre ?? '—'}</td>
                <td class="text-muted small">${u.email}</td>
                <td><span class="badge bg-${roleBadge[u.role] ?? 'secondary'} small">${u.role}</span></td>
                <td><span class="badge ${u.is_active ? 'bg-success' : 'bg-secondary'} small">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button class="btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}"
                    data-user-id="${u.id}" data-active="${u.is_active}">
                    ${u.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
      : '<p class="text-muted small">No hay usuarios.</p>';

    lista.querySelectorAll('[data-user-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await apiFetch(`/admin/usuarios/${btn.dataset.userId}/toggle`, { method: 'PATCH' });
          tabs.usuarios = null;
          cargarUsuarios();
        } catch (err) { showError(err.message); btn.disabled = false; }
      });
    });
  } catch { showError('Error al cargar usuarios'); }
};

// --- Empresas pendientes ---
const cargarEmpresas = async () => {
  tabs.empresas = true;
  try {
    const data = await apiFetch('/admin/empresas/pendientes');
    const lista = document.getElementById('empresasLista');
    lista.innerHTML = data.length
      ? data.map(c => `
          <div class="border rounded p-3 mb-2 d-flex justify-content-between align-items-center">
            <div>
              <strong>${c.nombre}</strong>
              <div class="text-muted small">${c.industria ?? ''} · ${c.ubicacion ?? ''}</div>
              <div class="text-muted small">${c.user_email}</div>
            </div>
            <button class="btn btn-sm btn-success" data-company-id="${c.id}">Verificar</button>
          </div>
        `).join('')
      : '<p class="text-muted small">No hay empresas pendientes.</p>';

    lista.querySelectorAll('[data-company-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await apiFetch(`/admin/empresas/${btn.dataset.companyId}/verificar`, {
            method: 'PATCH',
            body: JSON.stringify({ verificar: true }),
          });
          tabs.empresas = null;
          cargarEmpresas();
        } catch (err) { showError(err.message); btn.disabled = false; }
      });
    });
  } catch { showError('Error al cargar empresas'); }
};

// --- Vacantes pendientes ---
const cargarVacantes = async () => {
  tabs.vacantes = true;
  try {
    const data = await apiFetch('/admin/vacantes/pendientes');
    const lista = document.getElementById('vacantesLista');
    lista.innerHTML = data.length
      ? data.map(v => `
          <div class="border rounded p-3 mb-2 d-flex justify-content-between align-items-start">
            <div>
              <strong>${v.titulo}</strong>
              <div class="text-muted small">${v.empresa_nombre} · ${v.ubicacion}</div>
              <div class="text-muted small">${v.tipo_trabajo} · ${v.experiencia}</div>
            </div>
            <div class="d-flex gap-2 flex-shrink-0 ms-2">
              <button class="btn btn-sm btn-success" data-vacancy-id="${v.id}" data-action="aprobar">Aprobar</button>
              <button class="btn btn-sm btn-outline-danger" data-vacancy-id="${v.id}" data-action="rechazar">Rechazar</button>
            </div>
          </div>
        `).join('')
      : '<p class="text-muted small">No hay vacantes pendientes.</p>';

    lista.querySelectorAll('[data-vacancy-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        const aprobar = btn.dataset.action === 'aprobar';
        try {
          await apiFetch(`/admin/vacantes/${btn.dataset.vacancyId}/aprobar`, {
            method: 'PATCH',
            body: JSON.stringify({ aprobar }),
          });
          tabs.vacantes = null;
          cargarVacantes();
        } catch (err) { showError(err.message); btn.disabled = false; }
      });
    });
  } catch { showError('Error al cargar vacantes'); }
};

// Carga inicial del tab activo (usuarios)
cargarUsuarios();
```

- [ ] **Paso 5.3: Verificar sintaxis**

```bash
node --check /home/stephen/Documentos/Portal/frontend/js/pages/admin/dashboard.js
```

- [ ] **Paso 5.4: Verificar backend tests**

```bash
cd /home/stephen/Documentos/Portal/backend && npm test 2>&1 | tail -5
```

Salida esperada: `Tests: 38 passed`.

- [ ] **Paso 5.5: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add frontend/pages/admin/dashboard.html frontend/js/pages/admin/dashboard.js
git commit -m "feat: agregar dashboard admin (usuarios, empresas y vacantes pendientes)"
```

---

## Self-Review

**Spec coverage:**

| Página | API endpoints usados | Estado |
|--------|---------------------|--------|
| Landing | `GET /api/vacantes` | ✅ T1 |
| Login | `POST /api/auth/login` | ✅ T2 |
| Registro candidato | `POST /api/auth/registro/candidato` | ✅ T2 |
| Registro empresa | `POST /api/auth/registro/empresa` | ✅ T2 |
| Dashboard candidato | `GET/PUT /api/candidato/perfil`, `GET /api/vacantes`, `POST/GET /api/candidato/postulaciones` | ✅ T3 |
| Dashboard empresa | `GET/PUT /api/empresa/perfil`, `GET /api/empresa/vacantes`, `GET /api/empresa/vacantes/:id/aplicaciones`, `PATCH /api/empresa/aplicaciones/:id/status` | ✅ T4 |
| Crear vacante | `POST /api/vacantes` | ✅ T4 |
| Dashboard admin | `GET /api/admin/usuarios`, `PATCH toggle`, `GET /api/admin/empresas/pendientes`, `PATCH verificar`, `GET /api/admin/vacantes/pendientes`, `PATCH aprobar` | ✅ T5 |

**Placeholder scan:** Ningún TBD o TODO encontrado. Todo el código está completo.

**Type consistency:** `apiFetch`, `requireAuth`, `logout`, `redirectByRole` — nombrados igual en todos los archivos y coinciden con las exportaciones de `api.js` y `auth.js`.
