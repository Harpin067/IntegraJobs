# Migración Portal de Trabajo — Plan 2: Módulos de Dominio

> **Para agentes:** SUB-SKILL REQUERIDO: Usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para seguimiento.

**Goal:** Implementar los cuatro módulos de dominio REST — vacantes, candidato, empresa y admin — que completan la API del portal de empleo.

**Architecture:** Mismo patrón routes → controllers → services del Plan 1. Cada módulo vive en sus propios archivos y se registra en `app.js`. Los tests de integración usan la BD real (PostgreSQL) vía helpers compartidos que crean fixtures de prueba.

**Tech Stack:** Express 5, pg, express-validator, Jest + supertest. Directorio: `/home/stephen/Documentos/Portal`.

---

## Mapa de archivos

```
backend/src/
├── tests/
│   ├── setup.js                    EXISTE — se importa en todos los tests
│   ├── helpers.js                  CREAR — fixtures de prueba reutilizables
│   ├── vacantes.test.js            CREAR
│   ├── candidato.test.js           CREAR
│   ├── empresa.test.js             CREAR
│   └── admin.test.js               CREAR
├── services/
│   ├── vacantes.service.js         CREAR
│   ├── candidato.service.js        CREAR
│   ├── empresa.service.js          CREAR
│   └── admin.service.js            CREAR
├── controllers/
│   ├── vacantes.controller.js      CREAR
│   ├── candidato.controller.js     CREAR
│   ├── empresa.controller.js       CREAR
│   └── admin.controller.js         CREAR
├── routes/
│   ├── vacantes.routes.js          CREAR
│   ├── candidato.routes.js         CREAR
│   ├── empresa.routes.js           CREAR
│   └── admin.routes.js             CREAR
└── app.js                          MODIFICAR — registrar 4 nuevas rutas
```

---

## Tarea 1: Helpers de test compartidos

**Files:**
- Crear: `backend/src/tests/helpers.js`

Los helpers crean fixtures en la BD real para que los tests puedan probar endpoints protegidos sin repetir lógica de setup.

- [ ] **Paso 1.1: Crear `backend/src/tests/helpers.js`**

```js
// backend/src/tests/helpers.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/db.js';
import { env } from '../config/env.js';

const makeToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, nombre: user.nombre, email: user.email, companyId: user.companyId ?? null },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );

export const crearCandidato = async (overrides = {}) => {
  const email = overrides.email ?? `candidato_${Date.now()}@test.com`;
  const hash  = await bcrypt.hash('Password1!', 4);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, nombre, apellidos, cv_url)
     VALUES ($1, $2, 'CANDIDATO', $3, $4, $5) RETURNING *`,
    [email, hash, overrides.nombre ?? 'Test', overrides.apellidos ?? 'Candidato', overrides.cvUrl ?? 'https://example.com/cv.pdf']
  );
  const user = rows[0];
  return { user, token: makeToken({ ...user, companyId: null }) };
};

export const crearEmpresa = async (overrides = {}) => {
  const email = overrides.email ?? `empresa_${Date.now()}@test.com`;
  const hash  = await bcrypt.hash('Password1!', 4);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: uRows } = await client.query(
      `INSERT INTO users (email, password_hash, role, nombre, empresa_nombre)
       VALUES ($1, $2, 'EMPRESA', $3, $4) RETURNING *`,
      [email, hash, overrides.nombre ?? 'Admin Empresa', overrides.empresaNombre ?? 'TestCo']
    );
    const user = uRows[0];
    const { rows: cRows } = await client.query(
      `INSERT INTO companies (user_id, nombre, descripcion, ubicacion, industria, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.id, overrides.empresaNombre ?? 'TestCo', overrides.descripcion ?? 'Empresa de prueba',
       overrides.ubicacion ?? 'CDMX', overrides.industria ?? 'Tech', overrides.isVerified ?? true]
    );
    await client.query('COMMIT');
    const company = cRows[0];
    const token = makeToken({ ...user, companyId: company.id });
    return { user, company, token };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const crearVacante = async (companyId, overrides = {}) => {
  const { rows } = await pool.query(
    `INSERT INTO vacancies
       (company_id, titulo, descripcion, requisitos, ubicacion,
        tipo_trabajo, tipo_contrato, experiencia, contacto, status, is_approved)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      companyId,
      overrides.titulo        ?? 'Desarrollador JS',
      overrides.descripcion   ?? 'Descripción de prueba',
      overrides.requisitos    ?? 'Requisitos de prueba',
      overrides.ubicacion     ?? 'CDMX',
      overrides.tipoTrabajo   ?? 'remoto',
      overrides.tipoContrato  ?? 'completo',
      overrides.experiencia   ?? 'mid',
      overrides.contacto      ?? 'reclutamiento@testco.com',
      overrides.status        ?? 'activa',
      overrides.isApproved    ?? true,
    ]
  );
  return rows[0];
};

export const crearPostulacion = async (vacancyId, userId, overrides = {}) => {
  const { rows } = await pool.query(
    `INSERT INTO applications (vacancy_id, user_id, cv_snapshot, mensaje, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [vacancyId, userId,
     overrides.cvSnapshot ?? 'https://example.com/cv.pdf',
     overrides.mensaje    ?? null,
     overrides.status     ?? 'nuevo']
  );
  return rows[0];
};
```

- [ ] **Paso 1.2: Verificar que el helper funciona**

```bash
cd /home/stephen/Documentos/Portal/backend
node -e "
import('./src/tests/helpers.js').then(async h => {
  const c = await h.crearCandidato();
  console.log('Candidato OK:', c.user.email);
  const e = await h.crearEmpresa();
  console.log('Empresa OK:', e.company.nombre);
  const v = await h.crearVacante(e.company.id);
  console.log('Vacante OK:', v.titulo);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
"
```

Salida esperada: 3 líneas `... OK: ...` sin errores.

- [ ] **Paso 1.3: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/tests/helpers.js
git commit -m "test: agregar helpers de fixtures para tests de dominio"
```

---

## Tarea 2: Módulo Vacantes

**Files:**
- Crear: `backend/src/services/vacantes.service.js`
- Crear: `backend/src/controllers/vacantes.controller.js`
- Crear: `backend/src/routes/vacantes.routes.js`
- Crear: `backend/src/tests/vacantes.test.js`
- Modificar: `backend/src/app.js`

### Paso 2.1: Escribir tests primero (TDD)

Crear `backend/src/tests/vacantes.test.js`:

```js
// backend/src/tests/vacantes.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearEmpresa, crearVacante } from './helpers.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

describe('GET /api/vacantes', () => {
  test('devuelve lista vacía cuando no hay vacantes activas y aprobadas', async () => {
    const res = await request(app).get('/api/vacantes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('devuelve vacantes activas y aprobadas', async () => {
    const { company } = await crearEmpresa();
    await crearVacante(company.id, { status: 'activa', isApproved: true });
    await crearVacante(company.id, { status: 'pausada', isApproved: true });   // no aparece
    await crearVacante(company.id, { status: 'activa', isApproved: false });   // no aparece

    const res = await request(app).get('/api/vacantes');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].titulo).toBe('Desarrollador JS');
  });

  test('filtra por tipo_trabajo', async () => {
    const { company } = await crearEmpresa();
    await crearVacante(company.id, { tipoTrabajo: 'remoto' });
    await crearVacante(company.id, { tipoTrabajo: 'presencial', titulo: 'Dev Presencial' });

    const res = await request(app).get('/api/vacantes?tipo_trabajo=remoto');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].tipo_trabajo).toBe('remoto');
  });
});

describe('GET /api/vacantes/:id', () => {
  test('devuelve detalle de vacante existente', async () => {
    const { company } = await crearEmpresa();
    const vacante = await crearVacante(company.id);

    const res = await request(app).get(`/api/vacantes/${vacante.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(vacante.id);
    expect(res.body.titulo).toBe(vacante.titulo);
    expect(res.body.empresa).toBeDefined();
  });

  test('devuelve 404 si la vacante no existe', async () => {
    const res = await request(app).get('/api/vacantes/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/vacantes', () => {
  test('empresa autenticada crea vacante', async () => {
    const { token } = await crearEmpresa();
    const res = await request(app)
      .post('/api/vacantes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Backend Node.js', descripcion: 'Descripción', requisitos: 'Requisitos',
        ubicacion: 'Remoto', tipoTrabajo: 'remoto', tipoContrato: 'completo',
        experiencia: 'mid', contacto: 'hr@company.com',
      });
    expect(res.status).toBe(201);
    expect(res.body.titulo).toBe('Backend Node.js');
    expect(res.body.is_approved).toBe(false);
  });

  test('sin token devuelve 401', async () => {
    const res = await request(app).post('/api/vacantes').send({ titulo: 'Test' });
    expect(res.status).toBe(401);
  });

  test('candidato no puede crear vacante (403)', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .post('/api/vacantes')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Test' });
    expect(res.status).toBe(403);
  });
});
```

Agrega el import faltante al inicio del test (después del import de helpers):
```js
import { crearCandidato } from './helpers.js';
```

- [ ] **Paso 2.2: Ejecutar tests — deben FALLAR**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test -- --testPathPattern=vacantes 2>&1 | tail -15
```

Salida esperada: `FAIL` con `Cannot find module '../routes/vacantes.routes.js'` o similar.

- [ ] **Paso 2.3: Crear `backend/src/services/vacantes.service.js`**

```js
// backend/src/services/vacantes.service.js
import { pool } from '../db/db.js';

const makeError = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

export const listar = async ({ tipoTrabajo, tipoContrato, experiencia, ubicacion, q, page = 1, limit = 20 } = {}) => {
  const conditions = [`v.status = 'activa'`, `v.is_approved = true`];
  const params = [];

  if (tipoTrabajo)  { params.push(tipoTrabajo);  conditions.push(`v.tipo_trabajo = $${params.length}::tipo_trabajo`); }
  if (tipoContrato) { params.push(tipoContrato); conditions.push(`v.tipo_contrato = $${params.length}::tipo_contrato`); }
  if (experiencia)  { params.push(experiencia);  conditions.push(`v.experiencia = $${params.length}::experiencia_enum`); }
  if (ubicacion)    { params.push(`%${ubicacion}%`); conditions.push(`v.ubicacion ILIKE $${params.length}`); }
  if (q)            { params.push(`%${q}%`);     conditions.push(`(v.titulo ILIKE $${params.length} OR v.descripcion ILIKE $${params.length})`); }

  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const where = conditions.join(' AND ');
  const { rows } = await pool.query(
    `SELECT v.*, c.nombre AS empresa_nombre, c.logo_url AS empresa_logo
     FROM vacancies v
     JOIN companies c ON c.id = v.company_id
     WHERE ${where}
     ORDER BY v.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { data: rows, page: Number(page), limit: Number(limit) };
};

export const detalle = async (id) => {
  const { rows } = await pool.query(
    `SELECT v.*, c.nombre AS empresa_nombre, c.logo_url AS empresa_logo,
            c.descripcion AS empresa_descripcion, c.sitio_web AS empresa_sitio
     FROM vacancies v
     JOIN companies c ON c.id = v.company_id
     WHERE v.id = $1`,
    [id]
  );
  if (!rows[0]) throw makeError('Vacante no encontrada', 404);
  return { ...rows[0], empresa: {
    nombre: rows[0].empresa_nombre, logoUrl: rows[0].empresa_logo,
    descripcion: rows[0].empresa_descripcion, sitioWeb: rows[0].empresa_sitio,
  }};
};

export const crear = async (companyId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO vacancies
       (company_id, titulo, descripcion, requisitos, ubicacion,
        tipo_trabajo, tipo_contrato, experiencia, contacto, salario_min, salario_max)
     VALUES ($1,$2,$3,$4,$5,$6::tipo_trabajo,$7::tipo_contrato,$8::experiencia_enum,$9,$10,$11)
     RETURNING *`,
    [companyId, data.titulo, data.descripcion, data.requisitos, data.ubicacion,
     data.tipoTrabajo, data.tipoContrato, data.experiencia, data.contacto,
     data.salarioMin ?? null, data.salarioMax ?? null]
  );
  return rows[0];
};

export const actualizar = async (id, companyId, data) => {
  const { rows: existing } = await pool.query(
    'SELECT id FROM vacancies WHERE id = $1 AND company_id = $2', [id, companyId]
  );
  if (!existing[0]) throw makeError('Vacante no encontrada o no autorizado', 404);

  const fields = [];
  const params = [];
  const allowed = { titulo: 'titulo', descripcion: 'descripcion', requisitos: 'requisitos',
                    ubicacion: 'ubicacion', contacto: 'contacto',
                    salarioMin: 'salario_min', salarioMax: 'salario_max' };
  for (const [key, col] of Object.entries(allowed)) {
    if (data[key] !== undefined) { params.push(data[key]); fields.push(`${col} = $${params.length}`); }
  }
  if (!fields.length) throw makeError('Sin campos para actualizar', 400);

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE vacancies SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0];
};

export const cambiarStatus = async (id, companyId, status) => {
  const { rows } = await pool.query(
    `UPDATE vacancies SET status = $1::vacancy_status, updated_at = NOW()
     WHERE id = $2 AND company_id = $3 RETURNING *`,
    [status, id, companyId]
  );
  if (!rows[0]) throw makeError('Vacante no encontrada o no autorizado', 404);
  return rows[0];
};

export const misVacantes = async (companyId) => {
  const { rows } = await pool.query(
    `SELECT * FROM vacancies WHERE company_id = $1 ORDER BY created_at DESC`,
    [companyId]
  );
  return rows;
};
```

- [ ] **Paso 2.4: Crear `backend/src/controllers/vacantes.controller.js`**

```js
// backend/src/controllers/vacantes.controller.js
import * as svc from '../services/vacantes.service.js';

export const listar = async (req, res, next) => {
  try {
    const result = await svc.listar(req.query);
    res.json(result);
  } catch (err) { next(err); }
};

export const detalle = async (req, res, next) => {
  try {
    const vacante = await svc.detalle(req.params.id);
    res.json(vacante);
  } catch (err) { next(err); }
};

export const crear = async (req, res, next) => {
  try {
    const vacante = await svc.crear(req.user.companyId, req.body);
    res.status(201).json(vacante);
  } catch (err) { next(err); }
};

export const actualizar = async (req, res, next) => {
  try {
    const vacante = await svc.actualizar(req.params.id, req.user.companyId, req.body);
    res.json(vacante);
  } catch (err) { next(err); }
};

export const cambiarStatus = async (req, res, next) => {
  try {
    const vacante = await svc.cambiarStatus(req.params.id, req.user.companyId, req.body.status);
    res.json(vacante);
  } catch (err) { next(err); }
};

export const misVacantes = async (req, res, next) => {
  try {
    const vacantes = await svc.misVacantes(req.user.companyId);
    res.json(vacantes);
  } catch (err) { next(err); }
};
```

- [ ] **Paso 2.5: Crear `backend/src/routes/vacantes.routes.js`**

```js
// backend/src/routes/vacantes.routes.js
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/vacantes.controller.js';

const router = Router();

const TIPOS_TRABAJO   = ['presencial', 'remoto', 'hibrido'];
const TIPOS_CONTRATO  = ['completo', 'medio', 'temporal', 'freelance'];
const EXPERIENCIAS    = ['junior', 'mid', 'senior', 'lead'];
const STATUSES        = ['activa', 'pausada', 'cerrada'];

// Públicas
router.get('/',
  query('tipo_trabajo').optional().isIn(TIPOS_TRABAJO),
  query('tipo_contrato').optional().isIn(TIPOS_CONTRATO),
  query('experiencia').optional().isIn(EXPERIENCIAS),
  query('page').optional().isInt({ min: 1 }),
  validate,
  ctrl.listar
);

router.get('/:id',
  param('id').isUUID(),
  validate,
  ctrl.detalle
);

// Empresa autenticada
router.get('/empresa/mis-vacantes',
  requireAuth, requireRole('EMPRESA'),
  ctrl.misVacantes
);

router.post('/',
  requireAuth, requireRole('EMPRESA'),
  body('titulo').notEmpty().trim(),
  body('descripcion').notEmpty().trim(),
  body('requisitos').notEmpty().trim(),
  body('ubicacion').notEmpty().trim(),
  body('tipoTrabajo').isIn(TIPOS_TRABAJO),
  body('tipoContrato').isIn(TIPOS_CONTRATO),
  body('experiencia').isIn(EXPERIENCIAS),
  body('contacto').notEmpty().trim(),
  body('salarioMin').optional().isFloat({ min: 0 }),
  body('salarioMax').optional().isFloat({ min: 0 }),
  validate,
  ctrl.crear
);

router.put('/:id',
  requireAuth, requireRole('EMPRESA'),
  param('id').isUUID(),
  body('titulo').optional().notEmpty().trim(),
  body('descripcion').optional().notEmpty().trim(),
  validate,
  ctrl.actualizar
);

router.patch('/:id/status',
  requireAuth, requireRole('EMPRESA'),
  param('id').isUUID(),
  body('status').isIn(STATUSES),
  validate,
  ctrl.cambiarStatus
);

export default router;
```

- [ ] **Paso 2.6: Registrar vacantesRoutes en `backend/src/app.js`**

Lee el archivo actual y agrega estas dos líneas:

Al inicio (junto a los otros imports):
```js
import vacantesRoutes from './routes/vacantes.routes.js';
```

Dentro de `createApp()`, antes del bloque 404:
```js
  app.use('/api/vacantes', vacantesRoutes);
```

- [ ] **Paso 2.7: Ejecutar tests — deben PASAR**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test -- --testPathPattern=vacantes 2>&1 | tail -15
```

Salida esperada: `Tests: 7 passed` (o el número exacto de tests del archivo).

- [ ] **Paso 2.8: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/services/vacantes.service.js \
        backend/src/controllers/vacantes.controller.js \
        backend/src/routes/vacantes.routes.js \
        backend/src/tests/vacantes.test.js \
        backend/src/app.js
git commit -m "feat: agregar módulo vacantes (listar, detalle, crear, mis-vacantes)"
```

---

## Tarea 3: Módulo Candidato

**Files:**
- Crear: `backend/src/services/candidato.service.js`
- Crear: `backend/src/controllers/candidato.controller.js`
- Crear: `backend/src/routes/candidato.routes.js`
- Crear: `backend/src/tests/candidato.test.js`
- Modificar: `backend/src/app.js`

### Paso 3.1: Escribir tests primero (TDD)

Crear `backend/src/tests/candidato.test.js`:

```js
// backend/src/tests/candidato.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearCandidato, crearEmpresa, crearVacante } from './helpers.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

describe('GET /api/candidato/perfil', () => {
  test('devuelve perfil del candidato autenticado', async () => {
    const { token, user } = await crearCandidato();
    const res = await request(app)
      .get('/api/candidato/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
    expect(res.body.password_hash).toBeUndefined();
  });

  test('sin token devuelve 401', async () => {
    const res = await request(app).get('/api/candidato/perfil');
    expect(res.status).toBe(401);
  });

  test('empresa no puede acceder al perfil de candidato (403)', async () => {
    const { token } = await crearEmpresa();
    const res = await request(app)
      .get('/api/candidato/perfil')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/candidato/perfil', () => {
  test('actualiza nombre y teléfono del candidato', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .put('/api/candidato/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'NuevoNombre', telefono: '5512345678' });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('NuevoNombre');
    expect(res.body.telefono).toBe('5512345678');
  });
});

describe('POST /api/candidato/postulaciones/:vacancyId', () => {
  test('candidato se postula a una vacante activa y aprobada', async () => {
    const { token, user } = await crearCandidato();
    const { company }    = await crearEmpresa();
    const vacante        = await crearVacante(company.id);

    const res = await request(app)
      .post(`/api/candidato/postulaciones/${vacante.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Estoy interesado' });

    expect(res.status).toBe(201);
    expect(res.body.vacancy_id).toBe(vacante.id);
    expect(res.body.user_id).toBe(user.id);
    expect(res.body.status).toBe('nuevo');
  });

  test('no puede postularse dos veces a la misma vacante (409)', async () => {
    const { token, user } = await crearCandidato();
    const { company }    = await crearEmpresa();
    const vacante        = await crearVacante(company.id);

    await request(app)
      .post(`/api/candidato/postulaciones/${vacante.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .post(`/api/candidato/postulaciones/${vacante.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(409);
  });

  test('vacante no encontrada devuelve 404', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .post('/api/candidato/postulaciones/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(404);
  });
});

describe('GET /api/candidato/postulaciones', () => {
  test('devuelve lista de postulaciones del candidato', async () => {
    const { token, user } = await crearCandidato();
    const { company }    = await crearEmpresa();
    const vacante        = await crearVacante(company.id);

    await request(app)
      .post(`/api/candidato/postulaciones/${vacante.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .get('/api/candidato/postulaciones')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].vacancy_id).toBe(vacante.id);
  });
});
```

- [ ] **Paso 3.2: Ejecutar tests — deben FALLAR**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test -- --testPathPattern=candidato 2>&1 | tail -10
```

Salida esperada: `FAIL` — módulo candidato no existe aún.

- [ ] **Paso 3.3: Crear `backend/src/services/candidato.service.js`**

```js
// backend/src/services/candidato.service.js
import { pool } from '../db/db.js';

const makeError = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

export const getPerfil = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, email, nombre, apellidos, telefono, avatar_url, cv_url, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) throw makeError('Perfil no encontrado', 404);
  return rows[0];
};

export const actualizarPerfil = async (userId, data) => {
  const fields = [];
  const params = [];
  const allowed = { nombre: 'nombre', apellidos: 'apellidos', telefono: 'telefono',
                    avatarUrl: 'avatar_url', cvUrl: 'cv_url' };

  for (const [key, col] of Object.entries(allowed)) {
    if (data[key] !== undefined) { params.push(data[key]); fields.push(`${col} = $${params.length}`); }
  }
  if (!fields.length) throw makeError('Sin campos para actualizar', 400);

  params.push(userId);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length}
     RETURNING id, email, nombre, apellidos, telefono, avatar_url, cv_url`,
    params
  );
  return rows[0];
};

export const postular = async (userId, vacancyId, mensaje) => {
  const { rows: vac } = await pool.query(
    `SELECT id, cv_url FROM vacancies v
     JOIN users u ON u.id = $1
     WHERE v.id = $2 AND v.status = 'activa' AND v.is_approved = true`,
    [userId, vacancyId]
  );
  if (!vac[0]) throw makeError('Vacante no encontrada o no disponible', 404);

  const { rows: userRows } = await pool.query(
    'SELECT cv_url FROM users WHERE id = $1', [userId]
  );
  const cvSnapshot = userRows[0]?.cv_url ?? 'sin-cv';

  try {
    const { rows } = await pool.query(
      `INSERT INTO applications (vacancy_id, user_id, cv_snapshot, mensaje)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [vacancyId, userId, cvSnapshot, mensaje ?? null]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw makeError('Ya te has postulado a esta vacante', 409);
    throw err;
  }
};

export const misPostulaciones = async (userId) => {
  const { rows } = await pool.query(
    `SELECT a.*, v.titulo AS vacante_titulo, v.ubicacion AS vacante_ubicacion,
            c.nombre AS empresa_nombre
     FROM applications a
     JOIN vacancies v ON v.id = a.vacancy_id
     JOIN companies c ON c.id = v.company_id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [userId]
  );
  return rows;
};
```

- [ ] **Paso 3.4: Crear `backend/src/controllers/candidato.controller.js`**

```js
// backend/src/controllers/candidato.controller.js
import * as svc from '../services/candidato.service.js';

export const getPerfil = async (req, res, next) => {
  try { res.json(await svc.getPerfil(req.user.id)); }
  catch (err) { next(err); }
};

export const actualizarPerfil = async (req, res, next) => {
  try { res.json(await svc.actualizarPerfil(req.user.id, req.body)); }
  catch (err) { next(err); }
};

export const postular = async (req, res, next) => {
  try {
    const app = await svc.postular(req.user.id, req.params.vacancyId, req.body.mensaje);
    res.status(201).json(app);
  } catch (err) { next(err); }
};

export const misPostulaciones = async (req, res, next) => {
  try { res.json(await svc.misPostulaciones(req.user.id)); }
  catch (err) { next(err); }
};
```

- [ ] **Paso 3.5: Crear `backend/src/routes/candidato.routes.js`**

```js
// backend/src/routes/candidato.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/candidato.controller.js';

const router = Router();

router.use(requireAuth, requireRole('CANDIDATO'));

router.get('/perfil', ctrl.getPerfil);

router.put('/perfil',
  body('nombre').optional().notEmpty().trim(),
  body('apellidos').optional().notEmpty().trim(),
  body('telefono').optional().trim(),
  body('cvUrl').optional().isURL(),
  validate,
  ctrl.actualizarPerfil
);

router.post('/postulaciones/:vacancyId',
  param('vacancyId').isUUID(),
  body('mensaje').optional().trim(),
  validate,
  ctrl.postular
);

router.get('/postulaciones', ctrl.misPostulaciones);

export default router;
```

- [ ] **Paso 3.6: Registrar candidatoRoutes en `backend/src/app.js`**

Agrega el import:
```js
import candidatoRoutes from './routes/candidato.routes.js';
```

Agrega la ruta (antes del bloque 404):
```js
  app.use('/api/candidato', candidatoRoutes);
```

- [ ] **Paso 3.7: Ejecutar tests — deben PASAR**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test -- --testPathPattern=candidato 2>&1 | tail -15
```

Salida esperada: todos los tests `passed`.

- [ ] **Paso 3.8: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/services/candidato.service.js \
        backend/src/controllers/candidato.controller.js \
        backend/src/routes/candidato.routes.js \
        backend/src/tests/candidato.test.js \
        backend/src/app.js
git commit -m "feat: agregar módulo candidato (perfil, postulaciones)"
```

---

## Tarea 4: Módulo Empresa

**Files:**
- Crear: `backend/src/services/empresa.service.js`
- Crear: `backend/src/controllers/empresa.controller.js`
- Crear: `backend/src/routes/empresa.routes.js`
- Crear: `backend/src/tests/empresa.test.js`
- Modificar: `backend/src/app.js`

### Paso 4.1: Escribir tests primero (TDD)

Crear `backend/src/tests/empresa.test.js`:

```js
// backend/src/tests/empresa.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearEmpresa, crearCandidato, crearVacante, crearPostulacion } from './helpers.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

describe('GET /api/empresa/perfil', () => {
  test('empresa autenticada ve su perfil', async () => {
    const { token, company } = await crearEmpresa();
    const res = await request(app)
      .get('/api/empresa/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe(company.nombre);
    expect(res.body.is_verified).toBe(true);
  });

  test('candidato no puede acceder (403)', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .get('/api/empresa/perfil')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/empresa/perfil', () => {
  test('empresa actualiza su descripción y sitio web', async () => {
    const { token } = await crearEmpresa();
    const res = await request(app)
      .put('/api/empresa/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ descripcion: 'Nueva descripción', sitioWeb: 'https://testco.com' });

    expect(res.status).toBe(200);
    expect(res.body.descripcion).toBe('Nueva descripción');
    expect(res.body.sitio_web).toBe('https://testco.com');
  });
});

describe('GET /api/empresa/vacantes', () => {
  test('devuelve solo las vacantes de la empresa autenticada', async () => {
    const { token, company } = await crearEmpresa();
    const { company: otraEmpresa } = await crearEmpresa({ email: 'otra@empresa.com', empresaNombre: 'Otra Co' });

    await crearVacante(company.id, { titulo: 'Mi vacante' });
    await crearVacante(otraEmpresa.id, { titulo: 'Vacante de otra empresa' });

    const res = await request(app)
      .get('/api/empresa/vacantes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].titulo).toBe('Mi vacante');
  });
});

describe('GET /api/empresa/vacantes/:id/aplicaciones', () => {
  test('empresa ve aplicaciones a su vacante', async () => {
    const { token, company } = await crearEmpresa();
    const { user: candidato } = await crearCandidato();
    const vacante = await crearVacante(company.id);
    await crearPostulacion(vacante.id, candidato.id);

    const res = await request(app)
      .get(`/api/empresa/vacantes/${vacante.id}/aplicaciones`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].user_id).toBe(candidato.id);
  });
});

describe('PATCH /api/empresa/aplicaciones/:id/status', () => {
  test('empresa cambia status de una aplicación', async () => {
    const { token, company } = await crearEmpresa();
    const { user: candidato } = await crearCandidato();
    const vacante = await crearVacante(company.id);
    const app2    = await crearPostulacion(vacante.id, candidato.id);

    const res = await request(app)
      .patch(`/api/empresa/aplicaciones/${app2.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'en_proceso' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('en_proceso');
  });
});
```

- [ ] **Paso 4.2: Ejecutar tests — deben FALLAR**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test -- --testPathPattern=empresa 2>&1 | tail -10
```

Salida esperada: `FAIL`.

- [ ] **Paso 4.3: Crear `backend/src/services/empresa.service.js`**

```js
// backend/src/services/empresa.service.js
import { pool } from '../db/db.js';

const makeError = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

export const getPerfil = async (companyId) => {
  const { rows } = await pool.query(
    'SELECT * FROM companies WHERE id = $1', [companyId]
  );
  if (!rows[0]) throw makeError('Perfil de empresa no encontrado', 404);
  return rows[0];
};

export const actualizarPerfil = async (companyId, data) => {
  const fields = [];
  const params = [];
  const allowed = { nombre: 'nombre', descripcion: 'descripcion', sitioWeb: 'sitio_web',
                    ubicacion: 'ubicacion', industria: 'industria', logoUrl: 'logo_url' };

  for (const [key, col] of Object.entries(allowed)) {
    if (data[key] !== undefined) { params.push(data[key]); fields.push(`${col} = $${params.length}`); }
  }
  if (!fields.length) throw makeError('Sin campos para actualizar', 400);

  params.push(companyId);
  const { rows } = await pool.query(
    `UPDATE companies SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0];
};

export const misVacantes = async (companyId) => {
  const { rows } = await pool.query(
    `SELECT v.*,
            (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id) AS total_aplicaciones
     FROM vacancies v
     WHERE v.company_id = $1
     ORDER BY v.created_at DESC`,
    [companyId]
  );
  return rows;
};

export const aplicacionesDeVacante = async (vacancyId, companyId) => {
  const { rows: vac } = await pool.query(
    'SELECT id FROM vacancies WHERE id = $1 AND company_id = $2', [vacancyId, companyId]
  );
  if (!vac[0]) throw makeError('Vacante no encontrada o no autorizado', 404);

  const { rows } = await pool.query(
    `SELECT a.*, u.nombre AS candidato_nombre, u.email AS candidato_email,
            u.cv_url AS candidato_cv
     FROM applications a
     JOIN users u ON u.id = a.user_id
     WHERE a.vacancy_id = $1
     ORDER BY a.created_at DESC`,
    [vacancyId]
  );
  return rows;
};

export const cambiarStatusAplicacion = async (applicationId, companyId, status) => {
  const { rows: existing } = await pool.query(
    `SELECT a.id FROM applications a
     JOIN vacancies v ON v.id = a.vacancy_id
     WHERE a.id = $1 AND v.company_id = $2`,
    [applicationId, companyId]
  );
  if (!existing[0]) throw makeError('Aplicación no encontrada o no autorizado', 404);

  const { rows } = await pool.query(
    `UPDATE applications SET status = $1::application_status, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [status, applicationId]
  );
  return rows[0];
};
```

- [ ] **Paso 4.4: Crear `backend/src/controllers/empresa.controller.js`**

```js
// backend/src/controllers/empresa.controller.js
import * as svc from '../services/empresa.service.js';

export const getPerfil = async (req, res, next) => {
  try { res.json(await svc.getPerfil(req.user.companyId)); }
  catch (err) { next(err); }
};

export const actualizarPerfil = async (req, res, next) => {
  try { res.json(await svc.actualizarPerfil(req.user.companyId, req.body)); }
  catch (err) { next(err); }
};

export const misVacantes = async (req, res, next) => {
  try { res.json(await svc.misVacantes(req.user.companyId)); }
  catch (err) { next(err); }
};

export const aplicacionesDeVacante = async (req, res, next) => {
  try {
    const data = await svc.aplicacionesDeVacante(req.params.vacancyId, req.user.companyId);
    res.json(data);
  } catch (err) { next(err); }
};

export const cambiarStatusAplicacion = async (req, res, next) => {
  try {
    const data = await svc.cambiarStatusAplicacion(req.params.applicationId, req.user.companyId, req.body.status);
    res.json(data);
  } catch (err) { next(err); }
};
```

- [ ] **Paso 4.5: Crear `backend/src/routes/empresa.routes.js`**

```js
// backend/src/routes/empresa.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/empresa.controller.js';

const router = Router();

const APP_STATUSES = ['nuevo', 'en_proceso', 'rechazado', 'contratado'];

router.use(requireAuth, requireRole('EMPRESA'));

router.get('/perfil', ctrl.getPerfil);

router.put('/perfil',
  body('nombre').optional().notEmpty().trim(),
  body('descripcion').optional().notEmpty().trim(),
  body('sitioWeb').optional().isURL(),
  body('ubicacion').optional().notEmpty().trim(),
  body('industria').optional().notEmpty().trim(),
  validate,
  ctrl.actualizarPerfil
);

router.get('/vacantes', ctrl.misVacantes);

router.get('/vacantes/:vacancyId/aplicaciones',
  param('vacancyId').isUUID(),
  validate,
  ctrl.aplicacionesDeVacante
);

router.patch('/aplicaciones/:applicationId/status',
  param('applicationId').isUUID(),
  body('status').isIn(APP_STATUSES),
  validate,
  ctrl.cambiarStatusAplicacion
);

export default router;
```

- [ ] **Paso 4.6: Registrar empresaRoutes en `backend/src/app.js`**

Agrega el import:
```js
import empresaRoutes from './routes/empresa.routes.js';
```

Agrega la ruta (antes del bloque 404):
```js
  app.use('/api/empresa', empresaRoutes);
```

- [ ] **Paso 4.7: Ejecutar tests — deben PASAR**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test -- --testPathPattern=empresa 2>&1 | tail -15
```

- [ ] **Paso 4.8: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/services/empresa.service.js \
        backend/src/controllers/empresa.controller.js \
        backend/src/routes/empresa.routes.js \
        backend/src/tests/empresa.test.js \
        backend/src/app.js
git commit -m "feat: agregar módulo empresa (perfil, vacantes, gestión de aplicaciones)"
```

---

## Tarea 5: Módulo Admin

**Files:**
- Crear: `backend/src/services/admin.service.js`
- Crear: `backend/src/controllers/admin.controller.js`
- Crear: `backend/src/routes/admin.routes.js`
- Crear: `backend/src/tests/admin.test.js`
- Modificar: `backend/src/app.js`

### Paso 5.1: Escribir tests primero (TDD)

Crear `backend/src/tests/admin.test.js`:

```js
// backend/src/tests/admin.test.js
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearCandidato, crearEmpresa, crearVacante } from './helpers.js';
import { pool } from '../db/db.js';
import { env } from '../config/env.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

const adminToken = () =>
  jwt.sign({ id: '00000000-0000-0000-0000-000000000001', role: 'SUPERADMIN', nombre: 'Admin', email: 'admin@portal.com' },
    env.JWT_SECRET, { expiresIn: '1h' });

describe('GET /api/admin/usuarios', () => {
  test('superadmin lista todos los usuarios', async () => {
    await crearCandidato();
    await crearEmpresa();

    const res = await request(app)
      .get('/api/admin/usuarios')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0].password_hash).toBeUndefined();
  });

  test('candidato no puede acceder (403)', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .get('/api/admin/usuarios')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/admin/usuarios/:id/toggle', () => {
  test('superadmin desactiva un usuario', async () => {
    const { user } = await crearCandidato();

    const res = await request(app)
      .patch(`/api/admin/usuarios/${user.id}/toggle`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(false);
  });
});

describe('GET /api/admin/empresas/pendientes', () => {
  test('lista empresas sin verificar', async () => {
    await crearEmpresa({ isVerified: false });

    const res = await request(app)
      .get('/api/admin/empresas/pendientes')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].is_verified).toBe(false);
  });
});

describe('PATCH /api/admin/empresas/:id/verificar', () => {
  test('superadmin verifica una empresa', async () => {
    const { company } = await crearEmpresa({ isVerified: false });

    const res = await request(app)
      .patch(`/api/admin/empresas/${company.id}/verificar`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ verificar: true });

    expect(res.status).toBe(200);
    expect(res.body.is_verified).toBe(true);
  });
});

describe('GET /api/admin/vacantes/pendientes', () => {
  test('lista vacantes no aprobadas', async () => {
    const { company } = await crearEmpresa();
    await crearVacante(company.id, { isApproved: false });

    const res = await request(app)
      .get('/api/admin/vacantes/pendientes')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].is_approved).toBe(false);
  });
});

describe('PATCH /api/admin/vacantes/:id/aprobar', () => {
  test('superadmin aprueba una vacante', async () => {
    const { company } = await crearEmpresa();
    const vacante = await crearVacante(company.id, { isApproved: false });

    const res = await request(app)
      .patch(`/api/admin/vacantes/${vacante.id}/aprobar`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ aprobar: true });

    expect(res.status).toBe(200);
    expect(res.body.is_approved).toBe(true);
  });
});
```

- [ ] **Paso 5.2: Ejecutar tests — deben FALLAR**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test -- --testPathPattern=admin 2>&1 | tail -10
```

- [ ] **Paso 5.3: Crear `backend/src/services/admin.service.js`**

```js
// backend/src/services/admin.service.js
import { pool } from '../db/db.js';

const makeError = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

export const listarUsuarios = async () => {
  const { rows } = await pool.query(
    `SELECT id, email, nombre, apellidos, role, is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  return rows;
};

export const toggleUsuario = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1 RETURNING id, email, nombre, role, is_active`,
    [userId]
  );
  if (!rows[0]) throw makeError('Usuario no encontrado', 404);
  return rows[0];
};

export const empresasPendientes = async () => {
  const { rows } = await pool.query(
    `SELECT c.*, u.email AS user_email
     FROM companies c
     JOIN users u ON u.id = c.user_id
     WHERE c.is_verified = false
     ORDER BY c.created_at ASC`
  );
  return rows;
};

export const verificarEmpresa = async (companyId, verificar) => {
  const { rows } = await pool.query(
    `UPDATE companies SET is_verified = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [verificar, companyId]
  );
  if (!rows[0]) throw makeError('Empresa no encontrada', 404);
  return rows[0];
};

export const vacantesPendientes = async () => {
  const { rows } = await pool.query(
    `SELECT v.*, c.nombre AS empresa_nombre
     FROM vacancies v
     JOIN companies c ON c.id = v.company_id
     WHERE v.is_approved = false
     ORDER BY v.created_at ASC`
  );
  return rows;
};

export const aprobarVacante = async (vacancyId, aprobar) => {
  const status = aprobar ? 'activa' : 'rechazada';
  const { rows } = await pool.query(
    `UPDATE vacancies
     SET is_approved = $1, status = $2::vacancy_status, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [aprobar, status, vacancyId]
  );
  if (!rows[0]) throw makeError('Vacante no encontrada', 404);
  return rows[0];
};
```

- [ ] **Paso 5.4: Crear `backend/src/controllers/admin.controller.js`**

```js
// backend/src/controllers/admin.controller.js
import * as svc from '../services/admin.service.js';

export const listarUsuarios = async (req, res, next) => {
  try { res.json(await svc.listarUsuarios()); }
  catch (err) { next(err); }
};

export const toggleUsuario = async (req, res, next) => {
  try { res.json(await svc.toggleUsuario(req.params.userId)); }
  catch (err) { next(err); }
};

export const empresasPendientes = async (req, res, next) => {
  try { res.json(await svc.empresasPendientes()); }
  catch (err) { next(err); }
};

export const verificarEmpresa = async (req, res, next) => {
  try { res.json(await svc.verificarEmpresa(req.params.companyId, req.body.verificar)); }
  catch (err) { next(err); }
};

export const vacantesPendientes = async (req, res, next) => {
  try { res.json(await svc.vacantesPendientes()); }
  catch (err) { next(err); }
};

export const aprobarVacante = async (req, res, next) => {
  try { res.json(await svc.aprobarVacante(req.params.vacancyId, req.body.aprobar)); }
  catch (err) { next(err); }
};
```

- [ ] **Paso 5.5: Crear `backend/src/routes/admin.routes.js`**

```js
// backend/src/routes/admin.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireRole('SUPERADMIN'));

router.get('/usuarios', ctrl.listarUsuarios);

router.patch('/usuarios/:userId/toggle',
  param('userId').isUUID(),
  validate,
  ctrl.toggleUsuario
);

router.get('/empresas/pendientes', ctrl.empresasPendientes);

router.patch('/empresas/:companyId/verificar',
  param('companyId').isUUID(),
  body('verificar').isBoolean(),
  validate,
  ctrl.verificarEmpresa
);

router.get('/vacantes/pendientes', ctrl.vacantesPendientes);

router.patch('/vacantes/:vacancyId/aprobar',
  param('vacancyId').isUUID(),
  body('aprobar').isBoolean(),
  validate,
  ctrl.aprobarVacante
);

export default router;
```

- [ ] **Paso 5.6: Registrar adminRoutes en `backend/src/app.js`**

Agrega el import:
```js
import adminRoutes from './routes/admin.routes.js';
```

Agrega la ruta (antes del bloque 404):
```js
  app.use('/api/admin', adminRoutes);
```

- [ ] **Paso 5.7: Ejecutar todos los tests**

```bash
cd /home/stephen/Documentos/Portal/backend
npm test 2>&1 | tail -15
```

Salida esperada: todos los test suites (`auth`, `vacantes`, `candidato`, `empresa`, `admin`) pasando.

- [ ] **Paso 5.8: Commit**

```bash
cd /home/stephen/Documentos/Portal
git add backend/src/services/admin.service.js \
        backend/src/controllers/admin.controller.js \
        backend/src/routes/admin.routes.js \
        backend/src/tests/admin.test.js \
        backend/src/app.js
git commit -m "feat: agregar módulo admin (usuarios, empresas, vacantes pendientes)"
```

---

## app.js final esperado

Al completar las 5 tareas, `backend/src/app.js` debe verse así:

```js
// backend/src/app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes     from './routes/auth.routes.js';
import vacantesRoutes from './routes/vacantes.routes.js';
import candidatoRoutes from './routes/candidato.routes.js';
import empresaRoutes  from './routes/empresa.routes.js';
import adminRoutes    from './routes/admin.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(express.static(path.join(__dirname, '../../frontend')));

  app.use('/api/auth',      authRoutes);
  app.use('/api/vacantes',  vacantesRoutes);
  app.use('/api/candidato', candidatoRoutes);
  app.use('/api/empresa',   empresaRoutes);
  app.use('/api/admin',     adminRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  app.use((err, req, res, _next) => {
    const status = err.statusCode ?? 500;
    const message = status === 500 ? 'Error interno del servidor' : err.message;
    if (status === 500) console.error(err);
    res.status(status).json({ error: message });
  });

  return app;
}
```
