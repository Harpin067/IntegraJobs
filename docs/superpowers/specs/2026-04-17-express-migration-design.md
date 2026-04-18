# Spec de Migración: Portal de Trabajo
# Next.js 14 → Express 5 REST API + Vanilla JS/Bootstrap

> **Fecha:** 2026-04-17
> **Estado:** Aprobado
> **Decisión de arquitectura:** Opción B — API REST pura (JSON) + frontend estático desacoplado

---

## 1. Contexto

El proyecto actual es un portal de empleo (candidato / empresa / admin) construido con Next.js 14, Prisma, NextAuth y Tailwind/shadcn. Se migra a:

| Capa | Antes | Después |
|---|---|---|
| Servidor | Next.js 14 App Router | Express 5 (ES Modules) |
| Base de datos | Prisma ORM | `pg` driver — SQL crudo parametrizado |
| Autenticación | NextAuth v4 | Custom JWT con `bcryptjs` + `jsonwebtoken` |
| Validación | Zod | `express-validator` |
| Estilos | Tailwind CSS + shadcn/ui | Bootstrap 5 + CSS variables |
| Frontend | React 18 (SSR/CSR) | Vanilla JS (ES Modules) + HTML estático |
| Estado global | Zustand | `localStorage` (JWT) + fetch nativo |

---

## 2. Estructura de Directorios

```
portal-laboral/
├── backend/
│   ├── package.json              # "type": "module"
│   ├── .env
│   └── src/
│       ├── server.js             # Punto de entrada — app.listen()
│       ├── app.js                # Factory: middlewares globales, rutas, error handler
│       ├── config/
│       │   └── env.js            # Carga dotenv, exporta variables tipadas
│       ├── db/
│       │   └── db.js             # pg.Pool singleton exportado
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── vacantes.routes.js
│       │   ├── candidato.routes.js
│       │   ├── empresa.routes.js
│       │   └── admin.routes.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── vacantes.controller.js
│       │   ├── candidato.controller.js
│       │   ├── empresa.controller.js
│       │   └── admin.controller.js
│       ├── services/
│       │   ├── auth.service.js
│       │   ├── vacantes.service.js
│       │   ├── candidato.service.js
│       │   ├── empresa.service.js
│       │   └── admin.service.js
│       └── middleware/
│           ├── auth.middleware.js     # JWT verify + requireRole()
│           └── validate.middleware.js # express-validator error handler
│
├── frontend/
│   ├── index.html                # Landing pública + listado de empleos
│   ├── pages/
│   │   ├── login.html
│   │   ├── registro.html
│   │   ├── candidato/
│   │   │   ├── dashboard.html
│   │   │   ├── busqueda.html
│   │   │   └── perfil.html
│   │   ├── empresa/
│   │   │   ├── dashboard.html
│   │   │   ├── vacantes.html
│   │   │   ├── vacante-nueva.html
│   │   │   └── perfil.html
│   │   └── admin/
│   │       ├── dashboard.html
│   │       └── usuarios.html
│   ├── css/
│   │   └── theme.css             # Bootstrap 5 import + variables CSS del sistema
│   └── js/
│       ├── api.js                # fetch wrapper — adjunta Authorization header
│       ├── auth.js               # login(), logout(), getToken(), getUser()
│       └── pages/
│           ├── login.js
│           ├── registro.js
│           ├── candidato/
│           ├── empresa/
│           └── admin/
│
├── schema.sql                    # DDL completo — reemplaza migraciones de Prisma
└── docker-compose.yml            # PostgreSQL 16 + servicio backend
```

---

## 3. Autenticación

### Flujo de login
1. Cliente hace `POST /api/auth/login` con `{ email, password, loginType }`.
2. `auth.service.js` consulta `users` con pg, compara password con `bcrypt.compare()`.
3. Aplica las mismas reglas RBAC del sistema actual:
   - `EMPRESA` inactiva → error antes de generar token.
   - `EMPRESA` sin `isVerified` → error.
   - `CANDIDATO` solo desde `loginType: 'candidato'`.
   - `EMPRESA` solo desde `loginType: 'empresa'`.
   - `SUPERADMIN` puede desde cualquier `loginType`.
4. Devuelve `{ token, user: { id, role, nombre, email } }`.
5. Cliente guarda token en `localStorage` y redirige según rol.

### Middleware de autenticación
```js
// middleware/auth.middleware.js
export const requireAuth = (req, res, next) => { /* verifica JWT */ };
export const requireRole = (...roles) => (req, res, next) => { /* RBAC */ };
```

### Tablas eliminadas
Se eliminan los modelos de NextAuth del esquema: `accounts`, `sessions`, `verification_tokens`.
Todas las demás tablas se conservan con los mismos nombres (`@@map` de Prisma).

---

## 4. Contrato Routes → Controllers → Services

### Ejemplo: Vacantes

```js
// routes/vacantes.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/vacantes.controller.js';

const router = Router();

router.get('/',    ctrl.listar);
router.get('/:id', param('id').isUUID(), validate, ctrl.detalle);
router.post('/',
  requireAuth, requireRole('EMPRESA'),
  body('titulo').notEmpty().trim(),
  body('ubicacion').notEmpty().trim(),
  body('tipoTrabajo').isIn(['presencial','remoto','hibrido']),
  body('tipoContrato').isIn(['completo','medio','temporal','freelance']),
  body('experiencia').isIn(['junior','mid','senior','lead']),
  validate,
  ctrl.crear
);

export default router;
```

```js
// controllers/vacantes.controller.js
export const crear = async (req, res, next) => {
  try {
    const vacante = await vacantesService.crear(req.user.companyId, req.body);
    res.status(201).json(vacante);
  } catch (err) { next(err); }
};
```

```js
// services/vacantes.service.js
export const crear = async (companyId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO vacancies (company_id, titulo, ...) VALUES ($1,$2,...) RETURNING *`,
    [companyId, data.titulo, ...]
  );
  return rows[0];
};
```

---

## 5. Frontend — Vanilla JS + Bootstrap 5

- **Sin build step.** Archivos `.html` servidos como estáticos desde Express (`express.static('frontend')`).
- **Bootstrap 5** vía CDN. `theme.css` sobreescribe variables y agrega la paleta del sistema:

```css
:root {
  --color-primary:    #1A56DB;
  --color-secondary:  #10B981;
  --color-background: #F9FAFB;
  --color-text:       #111827;
  --color-danger:     #EF4444;
}
```

- **`js/api.js`** — wrapper de fetch:
```js
export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) { logout(); return; }
  return res.json();
};
```

- **`js/auth.js`** — gestión de sesión: `login()`, `logout()`, `getUser()`, `redirectByRole()`.
- Cada página tiene su propio módulo en `js/pages/` que se carga como `<script type="module">`.
- Guard de rutas privadas: cada página privada llama `getUser()` al inicio; si no hay token válido, redirige a `/pages/login.html`.

---

## 6. Manejo de Errores

- Servicios lanzan `Error` con propiedad `.statusCode` (400, 403, 404, 409, 422).
- Controladores capturan con `try/catch` y pasan al `next(err)`.
- Error handler global en `app.js`:
```js
app.use((err, req, res, next) => {
  const status = err.statusCode ?? 500;
  res.status(status).json({ error: err.message });
});
```
- `validate.middleware.js` intercepta errores de `express-validator` y responde `422 { errors: [...] }`.

---

## 7. Base de Datos

- `db/db.js` exporta un `pg.Pool` configurado desde `env.js`.
- Todo acceso a BD es SQL parametrizado (`$1`, `$2`...) — sin ORM, sin riesgo de inyección SQL.
- `schema.sql` en la raíz contiene el DDL completo (tablas, enums de PostgreSQL, índices).
- El seed inicial (`prisma/seed.ts`) se reescribe como `seed.js` (ES Module + pg).

---

## 8. Docker

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: portal
      POSTGRES_PASSWORD: portal_secret
      POSTGRES_DB: portal_db
    ports: ["5434:5432"]

  api:
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://portal:portal_secret@db:5432/portal_db
      JWT_SECRET: change_this_secret
      PORT: 3000
```

Express sirve el frontend estático desde `../frontend` (volumen montado).

---

## 9. Dependencias Backend

```json
{
  "type": "module",
  "dependencies": {
    "express": "^5.0.0",
    "pg": "^8.13.0",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.2.1",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5"
  }
}
```

---

## 10. Lo que se elimina vs. lo que se conserva

| Se elimina | Se conserva |
|---|---|
| Next.js, React, React-DOM | Esquema de BD (todos los modelos de dominio) |
| NextAuth, Prisma, shadcn/ui | Lógica RBAC (mismas reglas de roles) |
| Tailwind, Zustand, lucide-react | Paleta de colores y variables CSS |
| Tablas `accounts`, `sessions`, `verification_tokens` | Módulos: vacantes, candidato, empresa, admin |
| TypeScript (backend) | bcryptjs (ya era dependencia) |
