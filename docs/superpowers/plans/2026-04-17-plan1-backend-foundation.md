# Migración Portal de Trabajo — Plan 1: Cimientos del Backend

> **Para agentes:** SUB-SKILL REQUERIDO: Usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para seguimiento.

**Goal:** Scaffold completo del backend Express 5 con autenticación JWT funcional, pg driver y middleware de validación — listo para recibir los módulos de dominio del Plan 2.

**Architecture:** Express 5 API REST con ES Modules. Estructura routes → controllers → services. `db/db.js` exporta un `pg.Pool` singleton. Auth custom con `bcryptjs` + `jsonwebtoken`. El frontend estático (Plan 3) será servido desde este mismo servidor.

**Tech Stack:** Node.js 20+, Express 5, pg 8, bcryptjs 3, jsonwebtoken 9, express-validator 7, Jest (modo ESM con `--experimental-vm-modules`), supertest 7

---

## Mapa de archivos

```
/home/stephen/Documentos/Portal/
├── schema.sql                          CREAR
├── seed.js                             CREAR
├── docker-compose.yml                  REEMPLAZAR
├── .gitignore                          MODIFICAR
│
├── backend/
│   ├── package.json                    CREAR
│   ├── .env.example                    CREAR
│   └── src/
│       ├── server.js                   CREAR
│       ├── app.js                      CREAR
│       ├── config/
│       │   └── env.js                  CREAR
│       ├── db/
│       │   └── db.js                   CREAR
│       ├── middleware/
│       │   ├── validate.middleware.js  CREAR
│       │   └── auth.middleware.js      CREAR
│       ├── services/
│       │   └── auth.service.js         CREAR
│       ├── controllers/
│       │   └── auth.controller.js      CREAR
│       ├── routes/
│       │   └── auth.routes.js          CREAR
│       └── tests/
│           ├── setup.js                CREAR
│           └── auth.test.js            CREAR
│
└── frontend/                           CREAR (scaffold mínimo)
    ├── index.html
    ├── css/theme.css
    └── js/
        ├── api.js
        └── auth.js
```

---

## Tarea 1: Limpiar raíz y crear estructura de directorios

**Files:**
- Eliminar: archivos Next.js de la raíz
- Crear: `backend/`, `frontend/`, subdirectorios

- [ ] **Paso 1.1: Eliminar archivos Next.js de la raíz**

```bash
cd /home/stephen/Documentos/Portal
rm -rf src next.config.mjs next-env.d.ts postcss.config.mjs tsconfig.json node_modules package.json package-lock.json .next
```

Salida esperada: sin errores. Los archivos `prisma/`, `docs/`, `docker-compose.yml` y `.env` se conservan.

- [ ] **Paso 1.2: Crear estructura de directorios**

```bash
mkdir -p backend/src/{config,db,middleware,services,controllers,routes,tests}
mkdir -p frontend/{css,js/pages}
```

- [ ] **Paso 1.3: Actualizar .gitignore**

Crear `/home/stephen/Documentos/Portal/.gitignore`:

```gitignore
# Dependencias
backend/node_modules/
node_modules/

# Entorno
.env
backend/.env

# Build / Next.js legacy
.next/
dist/

# Logs
*.log
```

- [ ] **Paso 1.4: Commit del scaffold vacío**

```bash
git add -A
git commit -m "chore: limpiar Next.js e inicializar estructura Express 5 + frontend estático"
```

---

## Tarea 2: schema.sql — DDL completo de PostgreSQL

**Files:**
- Crear: `schema.sql`

- [ ] **Paso 2.1: Escribir `schema.sql`**

Crear `/home/stephen/Documentos/Portal/schema.sql`:

```sql
-- schema.sql — Portal de Trabajo
-- Ejecutar como: psql $DATABASE_URL -f schema.sql

-- Enums
CREATE TYPE role AS ENUM ('SUPERADMIN', 'EMPRESA', 'CANDIDATO');
CREATE TYPE tipo_trabajo AS ENUM ('presencial', 'remoto', 'hibrido');
CREATE TYPE tipo_contrato AS ENUM ('completo', 'medio', 'temporal', 'freelance');
CREATE TYPE experiencia_enum AS ENUM ('junior', 'mid', 'senior', 'lead');
CREATE TYPE vacancy_status AS ENUM ('activa', 'pausada', 'cerrada', 'rechazada');
CREATE TYPE application_status AS ENUM ('nuevo', 'en_proceso', 'rechazado', 'contratado');
CREATE TYPE resource_type AS ENUM ('articulo', 'tutorial', 'video');

-- Función updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Tabla users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  password_hash TEXT,
  role          role NOT NULL DEFAULT 'CANDIDATO',
  nombre        VARCHAR(255),
  apellidos     VARCHAR(255),
  telefono      VARCHAR(50),
  avatar_url    TEXT,
  cv_url        TEXT,
  empresa_nombre VARCHAR(255),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabla companies
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre      VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  logo_url    TEXT,
  sitio_web   VARCHAR(255),
  ubicacion   VARCHAR(255) NOT NULL,
  industria   VARCHAR(255) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabla vacancies
CREATE TABLE vacancies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  titulo        VARCHAR(255) NOT NULL,
  descripcion   TEXT NOT NULL,
  requisitos    TEXT NOT NULL,
  ubicacion     VARCHAR(255) NOT NULL,
  tipo_trabajo  tipo_trabajo NOT NULL,
  tipo_contrato tipo_contrato NOT NULL,
  salario_min   DECIMAL(12,2),
  salario_max   DECIMAL(12,2),
  experiencia   experiencia_enum NOT NULL,
  contacto      VARCHAR(255) NOT NULL,
  status        vacancy_status NOT NULL DEFAULT 'activa',
  is_approved   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER vacancies_updated_at
  BEFORE UPDATE ON vacancies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabla applications
CREATE TABLE applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id  UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      application_status NOT NULL DEFAULT 'nuevo',
  cv_snapshot TEXT NOT NULL,
  mensaje     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vacancy_id, user_id)
);
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabla reviews
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comentario  TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Tabla alerts
CREATE TABLE alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword     VARCHAR(255) NOT NULL,
  ubicacion   VARCHAR(255),
  tipo_trabajo VARCHAR(50),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla forum_categories
CREATE TABLE forum_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla forum_threads
CREATE TABLE forum_threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo      VARCHAR(255) NOT NULL,
  contenido   TEXT NOT NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER forum_threads_updated_at
  BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabla forum_replies
CREATE TABLE forum_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenido   TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla resources
CREATE TABLE resources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       VARCHAR(255) NOT NULL,
  contenido    TEXT NOT NULL,
  tipo         resource_type NOT NULL,
  imagen_url   TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índices de búsqueda frecuente
CREATE INDEX idx_vacancies_status       ON vacancies(status, is_approved);
CREATE INDEX idx_vacancies_company      ON vacancies(company_id);
CREATE INDEX idx_applications_user      ON applications(user_id);
CREATE INDEX idx_applications_vacancy   ON applications(vacancy_id);
CREATE INDEX idx_forum_threads_category ON forum_threads(category_id);
```

- [ ] **Paso 2.2: Verificar que el schema no tenga errores de sintaxis**

Con Docker corriendo:

```bash
docker compose up -d db
sleep 3
docker exec -i portal_db psql -U portal -d portal_db -f /dev/stdin < schema.sql
```

Salida esperada: líneas `CREATE TYPE`, `CREATE TABLE`, `CREATE TRIGGER`, `CREATE INDEX` sin errores.

- [ ] **Paso 2.3: Commit**

```bash
git add schema.sql
git commit -m "feat: agregar DDL completo de PostgreSQL (sin tablas NextAuth)"
```

---

## Tarea 3: docker-compose.yml actualizado

**Files:**
- Reemplazar: `docker-compose.yml`

- [ ] **Paso 3.1: Reemplazar `docker-compose.yml`**

Crear `/home/stephen/Documentos/Portal/docker-compose.yml`:

```yaml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    container_name: portal_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: portal
      POSTGRES_PASSWORD: portal_secret
      POSTGRES_DB: portal_db
    ports:
      - "5434:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: ./backend
    container_name: portal_api
    restart: unless-stopped
    depends_on:
      - db
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://portal:portal_secret@db:5432/portal_db
      JWT_SECRET: change_this_in_production
      PORT: 3000
      NODE_ENV: production
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./frontend:/app/frontend

volumes:
  postgres_data:
```

- [ ] **Paso 3.2: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: actualizar docker-compose para Express 5 API"
```

---

## Tarea 4: backend/package.json e instalación de dependencias

**Files:**
- Crear: `backend/package.json`
- Crear: `backend/.env.example`

- [ ] **Paso 4.1: Crear `backend/package.json`**

Crear `/home/stephen/Documentos/Portal/backend/package.json`:

```json
{
  "name": "portal-laboral-api",
  "version": "1.0.0",
  "description": "Portal de Trabajo — API REST Express 5",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "node --experimental-vm-modules node_modules/.bin/jest --runInBand",
    "test:watch": "node --experimental-vm-modules node_modules/.bin/jest --watch --runInBand"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^5.0.1",
    "express-validator": "^7.2.1",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.13.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {},
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

- [ ] **Paso 4.2: Instalar dependencias**

```bash
cd /home/stephen/Documentos/Portal/backend
npm install
```

Salida esperada: `added N packages` sin vulnerabilidades críticas.

- [ ] **Paso 4.3: Crear `backend/.env.example`**

Crear `/home/stephen/Documentos/Portal/backend/.env.example`:

```env
DATABASE_URL=postgresql://portal:portal_secret@localhost:5434/portal_db
JWT_SECRET=cambia_este_secreto_en_produccion
PORT=3000
NODE_ENV=development
```

- [ ] **Paso 4.4: Crear `backend/.env` (copia local — no se commitea)**

```bash
cp /home/stephen/Documentos/Portal/backend/.env.example /home/stephen/Documentos/Portal/backend/.env
```

- [ ] **Paso 4.5: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/package.json backend/.env.example
git commit -m "feat: inicializar backend Express 5 con ES Modules"
```

---

## Tarea 5: config/env.js + db/db.js

**Files:**
- Crear: `backend/src/config/env.js`
- Crear: `backend/src/db/db.js`

- [ ] **Paso 5.1: Crear `backend/src/config/env.js`**

```js
// backend/src/config/env.js
import 'dotenv/config';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET:   process.env.JWT_SECRET,
  PORT:         parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV:     process.env.NODE_ENV ?? 'development',
};

if (!env.DATABASE_URL) throw new Error('DATABASE_URL no definida en .env');
if (!env.JWT_SECRET)   throw new Error('JWT_SECRET no definida en .env');
```

- [ ] **Paso 5.2: Crear `backend/src/db/db.js`**

```js
// backend/src/db/db.js
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('Error inesperado en pool de pg:', err.message);
});
```

- [ ] **Paso 5.3: Verificar conexión manualmente**

```bash
cd /home/stephen/Documentos/Portal/backend
node -e "import('./src/db/db.js').then(m => m.pool.query('SELECT 1').then(r => { console.log('Conexión OK:', r.rows); m.pool.end(); }))"
```

Salida esperada: `Conexión OK: [ { '?column?': 1 } ]`

- [ ] **Paso 5.4: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/config/env.js backend/src/db/db.js
git commit -m "feat: agregar config de entorno y pg Pool singleton"
```

---

## Tarea 6: app.js + server.js

**Files:**
- Crear: `backend/src/app.js`
- Crear: `backend/src/server.js`

- [ ] **Paso 6.1: Crear `backend/src/app.js`**

```js
// backend/src/app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Frontend estático (Plan 3)
  app.use(express.static(path.join(__dirname, '../../../frontend')));

  // Rutas API
  app.use('/api/auth', authRoutes);

  // 404 para rutas API no encontradas
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Error handler global
  app.use((err, req, res, _next) => {
    const status = err.statusCode ?? 500;
    const message = status === 500 ? 'Error interno del servidor' : err.message;
    if (status === 500) console.error(err);
    res.status(status).json({ error: message });
  });

  return app;
}
```

- [ ] **Paso 6.2: Crear `backend/src/server.js`**

```js
// backend/src/server.js
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Portal API corriendo en http://localhost:${env.PORT}`);
});
```

- [ ] **Paso 6.3: Verificar que el servidor arranca (sin rutas aún)**

```bash
cd /home/stephen/Documentos/Portal/backend
node src/server.js &
sleep 1
curl -s http://localhost:3000/api/ping | cat
kill %1
```

Salida esperada: `{"error":"Ruta no encontrada"}` — confirma que el servidor responde.

- [ ] **Paso 6.4: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/app.js backend/src/server.js
git commit -m "feat: agregar Express app factory y servidor"
```

---

## Tarea 7: Middleware de validación

**Files:**
- Crear: `backend/src/middleware/validate.middleware.js`

- [ ] **Paso 7.1: Escribir el test primero**

Agregar al archivo `backend/src/tests/auth.test.js` (se crea vacío ahora, se completará en Tarea 11):

```bash
touch /home/stephen/Documentos/Portal/backend/src/tests/auth.test.js
```

- [ ] **Paso 7.2: Crear `backend/src/middleware/validate.middleware.js`**

```js
// backend/src/middleware/validate.middleware.js
import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};
```

- [ ] **Paso 7.3: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/middleware/validate.middleware.js
git commit -m "feat: agregar middleware de validación express-validator"
```

---

## Tarea 8: Middleware de autenticación JWT

**Files:**
- Crear: `backend/src/middleware/auth.middleware.js`

- [ ] **Paso 8.1: Crear `backend/src/middleware/auth.middleware.js`**

```js
// backend/src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};
```

- [ ] **Paso 8.2: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/middleware/auth.middleware.js
git commit -m "feat: agregar middleware de autenticación JWT con RBAC"
```

---

## Tarea 9: auth.service.js

**Files:**
- Crear: `backend/src/services/auth.service.js`

- [ ] **Paso 9.1: Crear `backend/src/services/auth.service.js`**

```js
// backend/src/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/db.js';
import { env } from '../config/env.js';

const makeToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, nombre: user.nombre ?? user.name, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );

const makeError = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

export const login = async ({ email, password, loginType }) => {
  const { rows } = await pool.query(
    `SELECT u.*, c.is_verified AS company_verified, c.id AS company_id
     FROM users u
     LEFT JOIN companies c ON c.user_id = u.id
     WHERE u.email = $1`,
    [email]
  );
  const user = rows[0];

  if (!user || !user.password_hash) throw makeError('Credenciales incorrectas', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw makeError('Credenciales incorrectas', 401);

  if (!user.is_active) throw makeError('Tu cuenta ha sido desactivada. Contacta a soporte.', 403);

  if (user.role === 'EMPRESA' && !user.is_active)
    throw makeError('Tu cuenta está en revisión.', 403);

  if (user.role === 'CANDIDATO' && loginType !== 'candidato')
    throw makeError('Esta cuenta pertenece a un candidato. Usa la pestaña correcta.', 403);

  if (user.role === 'EMPRESA' && loginType !== 'empresa')
    throw makeError('Esta cuenta pertenece a una empresa. Usa la pestaña correcta.', 403);

  if (user.role === 'EMPRESA') {
    if (!user.company_id)
      throw makeError('Tu perfil de empresa no ha sido completado.', 403);
    if (!user.company_verified)
      throw makeError('Tu empresa está pendiente de verificación por el administrador.', 403);
  }

  const token = makeToken(user);
  return {
    token,
    user: {
      id:     user.id,
      email:  user.email,
      role:   user.role,
      nombre: user.nombre ?? user.name,
      companyId: user.company_id ?? null,
    },
  };
};

export const registrarCandidato = async ({ email, password, nombre, apellidos }) => {
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) throw makeError('El email ya está registrado', 409);

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, nombre, apellidos)
     VALUES ($1, $2, 'CANDIDATO', $3, $4) RETURNING *`,
    [email, hash, nombre, apellidos]
  );
  const user = rows[0];
  return { token: makeToken(user), user: { id: user.id, email: user.email, role: user.role, nombre: user.nombre } };
};

export const registrarEmpresa = async ({ email, password, nombre, empresaNombre, descripcion, ubicacion, industria }) => {
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) throw makeError('El email ya está registrado', 409);

  const hash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: userRows } = await client.query(
      `INSERT INTO users (email, password_hash, role, nombre, empresa_nombre)
       VALUES ($1, $2, 'EMPRESA', $3, $4) RETURNING *`,
      [email, hash, nombre, empresaNombre]
    );
    const user = userRows[0];
    await client.query(
      `INSERT INTO companies (user_id, nombre, descripcion, ubicacion, industria)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, empresaNombre, descripcion, ubicacion, industria]
    );
    await client.query('COMMIT');
    return { message: 'Empresa registrada. Espera verificación del administrador.' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
```

- [ ] **Paso 9.2: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/services/auth.service.js
git commit -m "feat: agregar auth.service con login, registrarCandidato y registrarEmpresa"
```

---

## Tarea 10: auth.controller.js + auth.routes.js

**Files:**
- Crear: `backend/src/controllers/auth.controller.js`
- Crear: `backend/src/routes/auth.routes.js`

- [ ] **Paso 10.1: Crear `backend/src/controllers/auth.controller.js`**

```js
// backend/src/controllers/auth.controller.js
import * as authService from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) { next(err); }
};

export const registrarCandidato = async (req, res, next) => {
  try {
    const result = await authService.registrarCandidato(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const registrarEmpresa = async (req, res, next) => {
  try {
    const result = await authService.registrarEmpresa(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};
```

- [ ] **Paso 10.2: Crear `backend/src/routes/auth.routes.js`**

```js
// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('loginType').isIn(['candidato', 'empresa', 'admin']),
  validate,
  ctrl.login
);

// POST /api/auth/registro/candidato
router.post('/registro/candidato',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  body('nombre').notEmpty().trim(),
  body('apellidos').notEmpty().trim(),
  validate,
  ctrl.registrarCandidato
);

// POST /api/auth/registro/empresa
router.post('/registro/empresa',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  body('nombre').notEmpty().trim(),
  body('empresaNombre').notEmpty().trim(),
  body('descripcion').notEmpty().trim(),
  body('ubicacion').notEmpty().trim(),
  body('industria').notEmpty().trim(),
  validate,
  ctrl.registrarEmpresa
);

export default router;
```

- [ ] **Paso 10.3: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/controllers/auth.controller.js backend/src/routes/auth.routes.js
git commit -m "feat: agregar auth controller y rutas con express-validator"
```

---

## Tarea 11: Tests de integración — auth endpoints

**Files:**
- Crear: `backend/src/tests/setup.js`
- Crear: `backend/src/tests/auth.test.js`

> Los tests se conectan a la BD real (portal_db). Requiere `docker compose up -d db` antes de correrlos.

- [ ] **Paso 11.1: Crear `backend/src/tests/setup.js`**

```js
// backend/src/tests/setup.js
import { pool } from '../db/db.js';

export const cleanUsers = async () => {
  await pool.query('DELETE FROM applications');
  await pool.query('DELETE FROM companies');
  await pool.query('DELETE FROM users WHERE role != $1', ['SUPERADMIN']);
};

export const closePool = async () => pool.end();
```

- [ ] **Paso 11.2: Escribir `backend/src/tests/auth.test.js`**

```js
// backend/src/tests/auth.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';

const app = createApp();

beforeEach(cleanUsers);
afterAll(closePool);

// ── Registro candidato ──────────────────────────────────────────────
describe('POST /api/auth/registro/candidato', () => {
  test('registra un candidato nuevo y devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/registro/candidato')
      .send({ email: 'test@candidato.com', password: 'Password1!', nombre: 'Ana', apellidos: 'López' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('CANDIDATO');
  });

  test('rechaza email duplicado con 409', async () => {
    const payload = { email: 'dup@candidato.com', password: 'Password1!', nombre: 'X', apellidos: 'Y' };
    await request(app).post('/api/auth/registro/candidato').send(payload);
    const res = await request(app).post('/api/auth/registro/candidato').send(payload);
    expect(res.status).toBe(409);
  });

  test('rechaza password corta con 422', async () => {
    const res = await request(app)
      .post('/api/auth/registro/candidato')
      .send({ email: 'short@test.com', password: '123', nombre: 'X', apellidos: 'Y' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ── Registro empresa ────────────────────────────────────────────────
describe('POST /api/auth/registro/empresa', () => {
  test('registra empresa sin token (pendiente verificación)', async () => {
    const res = await request(app)
      .post('/api/auth/registro/empresa')
      .send({
        email: 'test@empresa.com', password: 'Password1!',
        nombre: 'Admin Empresa', empresaNombre: 'TechCo',
        descripcion: 'Empresa de tech', ubicacion: 'CDMX', industria: 'Software',
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/verificación/i);
    expect(res.body.token).toBeUndefined();
  });
});

// ── Login ───────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  test('candidato hace login correctamente', async () => {
    await request(app).post('/api/auth/registro/candidato')
      .send({ email: 'login@test.com', password: 'Password1!', nombre: 'Test', apellidos: 'User' });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password1!', loginType: 'candidato' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('CANDIDATO');
  });

  test('rechaza password incorrecta con 401', async () => {
    await request(app).post('/api/auth/registro/candidato')
      .send({ email: 'wrong@test.com', password: 'Password1!', nombre: 'Test', apellidos: 'User' });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrongpass', loginType: 'candidato' });

    expect(res.status).toBe(401);
  });

  test('candidato no puede entrar con loginType empresa', async () => {
    await request(app).post('/api/auth/registro/candidato')
      .send({ email: 'rbac@test.com', password: 'Password1!', nombre: 'Test', apellidos: 'User' });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'rbac@test.com', password: 'Password1!', loginType: 'empresa' });

    expect(res.status).toBe(403);
  });

  test('empresa no verificada no puede hacer login', async () => {
    await request(app).post('/api/auth/registro/empresa')
      .send({
        email: 'noverif@empresa.com', password: 'Password1!',
        nombre: 'Admin', empresaNombre: 'Corp',
        descripcion: 'Desc', ubicacion: 'MTY', industria: 'Tech',
      });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'noverif@empresa.com', password: 'Password1!', loginType: 'empresa' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/verificación/i);
  });

  test('endpoint con body vacío devuelve 422', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });
});

// requireAuth se prueba con las rutas de dominio en Plan 2.
```

- [ ] **Paso 11.3: Correr los tests (deben fallar por rutas de dominio no definidas aún)**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test
```

Los tests de registro y login deben **pasar**. El test de `/api/candidato/perfil` devuelve 404 (aceptable — la ruta se agrega en Plan 2). Si falla con error de conexión: verificar que `docker compose up -d db` esté corriendo.

- [ ] **Paso 11.4: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/tests/
git commit -m "test: agregar tests de integración para auth endpoints"
```

---

## Tarea 12: seed.js — usuario superadmin inicial

**Files:**
- Crear: `seed.js` (en raíz del proyecto)

- [ ] **Paso 12.1: Crear `seed.js`**

Crear `/home/stephen/Documentos/Portal/seed.js`:

```js
// seed.js — ES Module
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const hash = await bcrypt.hash('Admin1234!', 12);
  await pool.query(`
    INSERT INTO users (email, password_hash, role, nombre, apellidos)
    VALUES ($1, $2, 'SUPERADMIN', $3, $4)
    ON CONFLICT (email) DO NOTHING
  `, ['admin@portal.com', hash, 'Super', 'Admin']);

  console.log('Seed completado. Admin: admin@portal.com / Admin1234!');
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Paso 12.2: Ejecutar seed**

```bash
cd /home/stephen/Documentos/Portal
DATABASE_URL=postgresql://portal:portal_secret@localhost:5434/portal_db \
  node seed.js
```

Salida esperada: `Seed completado. Admin: admin@portal.com / Admin1234!`

- [ ] **Paso 12.3: Verificar login del admin**

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portal.com","password":"Admin1234!","loginType":"admin"}' | python3 -m json.tool
```

Salida esperada: JSON con `token` y `user.role: "SUPERADMIN"`.

- [ ] **Paso 12.4: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add seed.js
git commit -m "feat: agregar seed con usuario SUPERADMIN inicial"
```

---

## Tarea 13: Frontend scaffold mínimo

**Files:**
- Crear: `frontend/index.html`
- Crear: `frontend/css/theme.css`
- Crear: `frontend/js/api.js`
- Crear: `frontend/js/auth.js`

- [ ] **Paso 13.1: Crear `frontend/css/theme.css`**

```css
/* frontend/css/theme.css */
@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css');

:root {
  --color-primary:    #1A56DB;
  --color-secondary:  #10B981;
  --color-background: #F9FAFB;
  --color-text:       #111827;
  --color-danger:     #EF4444;
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
}

.btn-primary   { background-color: var(--color-primary);   border-color: var(--color-primary); }
.btn-secondary { background-color: var(--color-secondary); border-color: var(--color-secondary); }
.text-danger   { color: var(--color-danger) !important; }
```

- [ ] **Paso 13.2: Crear `frontend/js/api.js`**

```js
// frontend/js/api.js
const BASE = '/api';

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error ?? 'Error'), { status: res.status, data });
  return data;
};
```

- [ ] **Paso 13.3: Crear `frontend/js/auth.js`**

```js
// frontend/js/auth.js
import { apiFetch } from './api.js';

export const getToken = () => localStorage.getItem('token');
export const getUser  = () => JSON.parse(localStorage.getItem('user') ?? 'null');

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
};

export const redirectByRole = (role) => {
  const routes = {
    CANDIDATO:   '/pages/candidato/dashboard.html',
    EMPRESA:     '/pages/empresa/dashboard.html',
    SUPERADMIN:  '/pages/admin/dashboard.html',
  };
  window.location.href = routes[role] ?? '/';
};

export const requireAuth = () => {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = '/pages/login.html';
    return null;
  }
  return user;
};

export const login = async (email, password, loginType) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, loginType }),
  });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
};
```

- [ ] **Paso 13.4: Crear `frontend/index.html`**

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
      <p class="text-muted text-center">Cargando vacantes...</p>
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

- [ ] **Paso 13.5: Verificar que Express sirve el frontend**

```bash
cd /home/stephen/Documentos/Portal/backend
node src/server.js &
sleep 1
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
kill %1
```

Salida esperada: `200`

- [ ] **Paso 13.6: Commit final del Plan 1**

```bash
cd /home/stephen/Documentos/Portal
git add frontend/
git commit -m "feat: agregar scaffold de frontend estático con Bootstrap 5 y módulos JS base"
```

---

## Resumen del Plan 1

Al completar este plan tendrás:
- Backend Express 5 corriendo en `localhost:3000`
- 3 endpoints de auth funcionales y testeados (`/login`, `/registro/candidato`, `/registro/empresa`)
- JWT RBAC funcionando
- Schema PostgreSQL completo aplicado
- Frontend scaffold básico servido por Express
- Usuario SUPERADMIN para pruebas

**Siguiente paso:** Plan 2 — Módulos de dominio (vacantes, candidato, empresa, admin)
