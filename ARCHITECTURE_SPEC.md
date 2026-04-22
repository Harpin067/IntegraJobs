  # ARCHITECTURE_SPEC.md — IntegraJobs

  > **Versión:** 2.0.0 | **Fecha:** 2026-04-20
  > **Autor:** Arquitectura de Software / Tech Lead
  > **Estado:** Especificación vigente — refleja el código real en `main`

  ---

  ## 0. Cambios respecto a la v1.0.0

  La v1.0.0 describía un stack **Next.js 14 + App Router + NextAuth + Zustand** que nunca se implementó. El proyecto se ejecutó con un stack distinto, más pragmático y con menor superficie de mantenimiento. Este documento reemplaza por completo la v1.0.0 y es la única fuente de verdad arquitectónica.

  ---

  ## 1. Stack Tecnológico

  | Capa | Tecnología | Justificación |
  |---|---|---|
  | **Servidor HTTP** | Node.js 20 LTS + Express 5 | Express 5 soporta routing asíncrono nativo (los errores en `async` llegan a `next()` sin wrappers). Estable, conocido por todo el equipo, cero curva de aprendizaje. |
  | **Frontend** | HTML Vanilla + JS modular (ES Modules) | Sin framework pesado: tiempos de carga mínimos, deploy sencillo (el propio Express sirve los estáticos). Alinea con nuestro público objetivo en redes móviles de El Salvador. |
  | **Estilos** | CSS puro con variables (`theme.css`) | Sin pipeline de build. Tokens de color expuestos como `:root { --color-* }` para consistencia entre páginas. |
  | **Esquema de datos** | Prisma 5 (solo schema + seed) | Declarativo, `prisma db push` sincroniza cambios sin migraciones manuales en desarrollo. Tipado de enums gratuito. |
  | **Acceso a BD (runtime)** | `pg` (Pool) con SQL parametrizado | El backend **no** usa Prisma Client en caliente. Se optó por `pg` directo porque las queries son mayoritariamente agregaciones y reportes donde SQL explícito es más claro y performante que un query builder. |
  | **Base de Datos** | PostgreSQL 16 (Docker) | Relacional robusto. Enums nativos alineados con `schema.prisma`. Expuesto en `localhost:5434` al host, `db:5432` en la red interna de Compose. |
  | **Autenticación** | JWT manual (`jsonwebtoken`) + `bcryptjs` | Sin NextAuth: stateless, portable, sin dependencia de frontend React. Middleware propio (`requireAuth`, `requireRole`) aplica políticas por rol. |
  | **Validación** | `express-validator` | Validación declarativa por ruta. Los errores los transforma el middleware `validate` en respuestas 422 uniformes. |
  | **Contenedorización** | Docker + Docker Compose | Un `docker compose up db` y el entorno está listo. El backend puede correr en host o en contenedor según preferencia del desarrollador. |
  | **Testing** | Jest + Supertest | Tests de integración por módulo (`auth.test.js`, `vacantes.test.js`, etc.). |
  | **Tipografía** | Inter (Google Fonts) | Importada vía `<link>` directo en los HTML. |

  ### 1.1 Paleta UX (Variables CSS Globales)

  Definidas en `frontend/css/theme.css` y reutilizadas por todas las páginas:

  ```css
  :root {
    --color-primary:    #1A56DB; /* Azul Corporativo — botones primarios, enlaces */
    --color-secondary:  #10B981; /* Verde Éxito — "Aplicar", confirmaciones */
    --color-background: #F9FAFB; /* Gris Claro — fondo general */
    --color-text:       #111827; /* Gris Oscuro — texto principal */
    --color-danger:     #EF4444; /* Rojo Suave — errores, destructivo */
  }
  ```

  ### 1.2 Principios de diseño

  1. **Pragmatismo sobre novedad.** No hay SSR, no hay hydration, no hay bundler. El HTML llega listo al navegador.
  2. **Separación limpia de capas.** `routes → controllers → services → db`. Ningún controlador toca `pg` directamente.
  3. **Stateless.** El servidor no guarda sesión: todo se valida en el JWT que viaja en `Authorization: Bearer`.
  4. **Un solo origen de verdad para el esquema.** `prisma/schema.prisma`. El resto del código consume los enums como strings.

  ---

  ## 2. Estructura de Directorios Real

  ```
  Portal/
  ├── prisma/
  │   ├── schema.prisma              # [CARLOS]  Modelos + enums (fuente de verdad)
  │   └── seed.ts                    # [CARLOS]  Seed: usuarios + empresa + vacantes
  │
  ├── backend/
  │   ├── Dockerfile
  │   ├── package.json
  │   └── src/
  │       ├── server.js              # [CARLOS]  Arranque HTTP (lee PORT)
  │       ├── app.js                 # [CARLOS]  Ensamblado Express: CORS, JSON, static, rutas, 404, error handler
  │       │
  │       ├── config/
  │       │   └── env.js             # [CARLOS]  Lee y valida variables de entorno
  │       │
  │       ├── db/
  │       │   └── db.js              # [CARLOS]  Pool `pg` compartido
  │       │
  │       ├── middleware/
  │       │   ├── auth.middleware.js     # [BRIAN]  requireAuth, requireRole
  │       │   └── validate.middleware.js # [CARLOS] Transforma errores de express-validator → 422
  │       │
  │       ├── routes/                # Una ruta por módulo; monta middleware y delega al controlador
  │       │   ├── auth.routes.js         # [BRIAN]
  │       │   ├── public.routes.js       # [CARLOS]
  │       │   ├── vacantes.routes.js     # [WALTER]
  │       │   ├── candidato.routes.js    # [WILBER]
  │       │   ├── empresa.routes.js      # [WALTER]
  │       │   └── admin.routes.js        # [CARLOS]
  │       │
  │       ├── controllers/           # Validación fina + serialización HTTP. Sin SQL.
  │       │   ├── auth.controller.js     # [BRIAN]
  │       │   ├── vacantes.controller.js # [WALTER]
  │       │   ├── candidato.controller.js# [WILBER]
  │       │   ├── empresa.controller.js  # [WALTER]
  │       │   └── admin.controller.js    # [CARLOS]
  │       │
  │       ├── services/              # Lógica de negocio + SQL vía `pool.query(...)`
  │       │   ├── auth.service.js        # [BRIAN]
  │       │   ├── public.service.js      # [CARLOS]
  │       │   ├── vacantes.service.js    # [WALTER]
  │       │   ├── candidato.service.js   # [WILBER]
  │       │   ├── empresa.service.js     # [WALTER]
  │       │   └── admin.service.js       # [CARLOS]
  │       │
  │       └── tests/                 # Jest + Supertest (uno por módulo)
  │           ├── setup.js
  │           ├── helpers.js
  │           ├── auth.test.js          # [BRIAN]
  │           ├── vacantes.test.js      # [WALTER]
  │           ├── candidato.test.js     # [WILBER]
  │           ├── empresa.test.js       # [WALTER]
  │           ├── admin.test.js         # [CARLOS]
  │           └── public.test.js        # [CARLOS]
  │
  ├── frontend/                      # Estáticos servidos por Express (app.js)
  │   ├── index.html                 # [CARLOS]  Landing
  │   ├── busqueda.html              # [WILBER]  Búsqueda pública de vacantes
  │   ├── vacante.html               # [WILBER]  Detalle de vacante
  │   ├── css/
  │   │   └── theme.css              # [CARLOS]  Tokens globales
  │   ├── img/
  │   ├── js/                        # Módulos ES (imports nativos)
  │   │   ├── api.js                 # [CARLOS]  Cliente fetch + manejo del JWT
  │   │   ├── auth.js                # [BRIAN]
  │   │   ├── shell.js               # [CARLOS]  Header/footer inyectables
  │   │   ├── icons.js               # [CARLOS]
  │   │   ├── helpers.js             # [CARLOS]
  │   │   ├── index.js               # [CARLOS]  Landing
  │   │   ├── busqueda.js            # [WILBER]
  │   │   ├── vacante.js             # [WILBER]
  │   │   └── pages/                 # JS específico por página privada
  │   └── pages/
  │       ├── login.html                     # [BRIAN]
  │       ├── registro.html                  # [BRIAN]
  │       ├── registro-candidato.html        # [BRIAN]
  │       ├── registro-empresa.html          # [BRIAN]
  │       ├── registro-exitoso-empresa.html  # [BRIAN]
  │       ├── candidato/
  │       │   ├── dashboard.html     # [WILBER]
  │       │   ├── busqueda.html      # [WILBER]
  │       │   └── perfil.html        # [WILBER]
  │       ├── empresa/
  │       │   ├── dashboard.html     # [WALTER]
  │       │   ├── vacantes.html      # [WALTER]
  │       │   ├── crear-vacante.html # [WALTER]
  │       │   └── perfil.html        # [WALTER]
  │       └── admin/
  │           ├── dashboard.html     # [CARLOS]
  │           └── usuarios.html      # [CARLOS]
  │
  ├── docker-compose.yml             # [CARLOS]
  ├── .env.example                   # [CARLOS]
  ├── DEPLOY.md                      # [CARLOS]
  └── ARCHITECTURE_SPEC.md           # [CARLOS]  (este archivo)
  ```

  ---

  ## 3. Arquitectura Lógica

  ```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                       Navegador (HTML Vanilla)                       │
  │  pages/*.html  ──▶  js/api.js  ──▶  fetch("/api/...", Bearer JWT)    │
  └──────────────────────────────────────────────────────────────────────┘
                                │ HTTPS
                                ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                        Express 5 (backend/src)                       │
  │                                                                      │
  │   app.js                                                             │
  │    ├─ cors(), express.json()                                         │
  │    ├─ express.static("frontend/")     ← sirve HTML/CSS/JS vanilla    │
  │    ├─ /api/public     → public.routes  → public.service              │
  │    ├─ /api/auth       → auth.routes    → auth.controller   → service │
  │    ├─ /api/vacantes   → vacantes.*     (requireAuth + role EMPRESA)  │
  │    ├─ /api/candidato  → candidato.*    (requireAuth + CANDIDATO)     │
  │    ├─ /api/empresa    → empresa.*      (requireAuth + EMPRESA)       │
  │    ├─ /api/admin      → admin.*        (requireAuth + SUPERADMIN)    │
  │    ├─ 404 handler /api                                               │
  │    └─ error handler global (statusCode → JSON uniforme)              │
  │                                                                      │
  │   middleware/auth.middleware.js                                      │
  │    ├─ requireAuth:    jwt.verify(Bearer token, env.JWT_SECRET)       │
  │    └─ requireRole:    chequea req.user.role contra whitelist         │
  └──────────────────────────────────────────────────────────────────────┘
                                │ pg.Pool (SQL parametrizado)
                                ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │           PostgreSQL 16 (Docker, volumen persistente)                │
  │           Esquema definido y gobernado por prisma/schema.prisma      │
  └──────────────────────────────────────────────────────────────────────┘
  ```

  ### 3.1 Flujo de una request autenticada

  1. El navegador envía `Authorization: Bearer <jwt>` a `/api/<modulo>/...`.
  2. Express enruta al `*.routes.js` correspondiente.
  3. `requireAuth` valida firma/expiración del JWT y popula `req.user = { sub, role, email }`.
  4. `requireRole('EMPRESA' | 'CANDIDATO' | 'SUPERADMIN')` aplica autorización por rol.
  5. `express-validator` + middleware `validate` revisan el body/params/query.
  6. El **controlador** extrae datos de `req`, delega al **service**, serializa la respuesta.
  7. El **service** ejecuta `pool.query(SQL, [params])` y devuelve datos del dominio.
  8. Cualquier `throw` sube al error handler global → respuesta JSON uniforme `{ error: "..." }`.

  ---

  ## 4. Contratos de API (REST, prefijo `/api`)

  ### 4.1 Público (sin token)

  | Método | Ruta | Descripción |
  |---|---|---|
  | `GET`  | `/api/public/stats`          | KPIs de la landing (usuarios, vacantes activas, empresas) |
  | `GET`  | `/api/public/vacantes`       | Búsqueda pública (`q`, `ubicacion`, `page`, `limit`) |
  | `GET`  | `/api/public/vacantes/:id`   | Detalle público de una vacante |

  ### 4.2 Autenticación — `/api/auth` (owner: **Brian**)

  | Método | Ruta | Body | Descripción |
  |---|---|---|---|
  | `POST` | `/api/auth/login`              | `email`, `password`, `loginType` (`candidato\|empresa\|admin`) | Retorna `{ token, user }` |
  | `POST` | `/api/auth/registro/candidato` | `email`, `password`, `nombre`, `apellidos` | Crea `User` con rol `CANDIDATO` |
  | `POST` | `/api/auth/registro/empresa`   | `email`, `password`, `nombre`, `empresaNombre`, `ubicacion`, `industria`, `descripcion?`, `sitioWeb?` | Crea `User` (rol `EMPRESA`) + `Company` asociada |

  ### 4.3 Vacantes — `/api/vacantes` (owner: **Walter**)

  | Método | Ruta | Rol | Descripción |
  |---|---|---|---|
  | `GET`   | `/api/vacantes`                       | público  | Listar vacantes activas con filtros (`tipo_trabajo`, `tipo_contrato`, `experiencia`, `page`) |
  | `GET`   | `/api/vacantes/:id`                   | público  | Detalle de una vacante |
  | `GET`   | `/api/vacantes/empresa/mis-vacantes`  | EMPRESA  | Vacantes de la empresa del usuario autenticado |
  | `POST`  | `/api/vacantes`                       | EMPRESA  | Crear vacante (`titulo`, `descripcion`, `requisitos`, `ubicacion`, `tipoTrabajo`, `tipoContrato`, `experiencia`, `contacto`, `salarioMin?`, `salarioMax?`) |
  | `PUT`   | `/api/vacantes/:id`                   | EMPRESA  | Actualizar campos editables |
  | `PATCH` | `/api/vacantes/:id/status`            | EMPRESA  | `status ∈ {activa, pausada, cerrada}` |

  ### 4.4 Candidato — `/api/candidato` (owner: **Wilber**)

  | Método | Ruta | Descripción |
  |---|---|---|
  | `GET`  | `/api/candidato/perfil`                        | Perfil del candidato autenticado |
  | `PUT`  | `/api/candidato/perfil`                        | Actualizar nombre, apellidos, teléfono, `cvUrl` |
  | `POST` | `/api/candidato/postulaciones/:vacancyId`      | Postularse a una vacante (con `mensaje` opcional) |
  | `GET`  | `/api/candidato/postulaciones`                 | Listar postulaciones propias |

  Todas las rutas están tras `requireAuth + requireRole('CANDIDATO')`.

  ### 4.5 Empresa — `/api/empresa` (owner: **Walter**)

  | Método | Ruta | Descripción |
  |---|---|---|
  | `GET`   | `/api/empresa/perfil`                                   | Perfil de la empresa del usuario |
  | `PUT`   | `/api/empresa/perfil`                                   | Actualizar `nombre`, `descripcion`, `sitioWeb`, `ubicacion`, `industria` |
  | `GET`   | `/api/empresa/vacantes`                                 | Vacantes propias |
  | `GET`   | `/api/empresa/vacantes/:vacancyId/aplicaciones`         | Aplicantes por vacante |
  | `PATCH` | `/api/empresa/aplicaciones/:applicationId/status`       | `status ∈ {nuevo, en_proceso, rechazado, contratado}` |

  Todas tras `requireAuth + requireRole('EMPRESA')`.

  ### 4.6 Admin — `/api/admin` (owner: **Carlos**)

  | Método | Ruta | Descripción |
  |---|---|---|
  | `GET`   | `/api/admin/usuarios`                              | Listar usuarios |
  | `PATCH` | `/api/admin/usuarios/:userId/toggle`               | Activar/desactivar usuario |
  | `GET`   | `/api/admin/empresas/pendientes`                   | Empresas sin verificar |
  | `PATCH` | `/api/admin/empresas/:companyId/verificar`         | `{ verificar: boolean }` |
  | `GET`   | `/api/admin/vacantes/pendientes`                   | Vacantes sin aprobar |
  | `PATCH` | `/api/admin/vacantes/:vacancyId/aprobar`           | `{ aprobar: boolean }` |

  Todas tras `requireAuth + requireRole('SUPERADMIN')`.

  ### 4.7 Formato uniforme de errores

  Cualquier error en el pipeline termina en el handler global de `app.js`:

  ```json
  { "error": "Descripción humana del error" }
  ```

  | Código | Caso típico |
  |---|---|
  | `400` | Body malformado |
  | `401` | `Token requerido` / `Token inválido o expirado` |
  | `403` | `Acceso denegado` (rol incorrecto) |
  | `404` | `Ruta no encontrada` (bajo `/api`) |
  | `422` | Validación de `express-validator` |
  | `500` | Error interno (no se filtra el mensaje al cliente) |

  ---

  ## 5. División de Trabajo (4 Agentes)

  Cada agente es **dueño** de un módulo vertical: rutas, controlador, servicio, tests y HTML/JS correspondientes. Los cambios fuera del módulo propio requieren PR con revisión del owner.

  ### Brian — **Autenticación y Sesiones**
  - **Backend:** `routes/auth.routes.js`, `controllers/auth.controller.js`, `services/auth.service.js`, `middleware/auth.middleware.js`
  - **Frontend:** `pages/login.html`, `pages/registro*.html`, `js/auth.js`
  - **Tests:** `tests/auth.test.js`
  - **Responsable de:** hashing con bcrypt, emisión de JWT, middleware `requireAuth`/`requireRole`, formularios de login/registro, almacenamiento del token en el cliente.

  ### Wilber — **Módulo Candidato**
  - **Backend:** `routes/candidato.routes.js`, `controllers/candidato.controller.js`, `services/candidato.service.js`
  - **Frontend:** `busqueda.html`, `vacante.html`, `pages/candidato/*`, `js/busqueda.js`, `js/vacante.js`
  - **Tests:** `tests/candidato.test.js`
  - **Responsable de:** perfil del candidato, búsqueda de vacantes, flujo de postulación, CV (`cvUrl`), listado de postulaciones propias.

  ### Walter — **Módulo Empresa y Vacantes**
  - **Backend:** `routes/empresa.routes.js` + `routes/vacantes.routes.js`, controladores y servicios asociados
  - **Frontend:** `pages/empresa/*` (dashboard, vacantes, crear-vacante, perfil)
  - **Tests:** `tests/empresa.test.js`, `tests/vacantes.test.js`
  - **Responsable de:** CRUD de vacantes, revisión de aplicantes, cambio de status de aplicación y de vacante, perfil de empresa.

  ### Carlos — **Admin + Plataforma (shared)**
  - **Backend:** `routes/admin.routes.js`, controlador y servicio admin, `routes/public.routes.js`, `services/public.service.js`, `app.js`, `server.js`, `config/env.js`, `db/db.js`, `middleware/validate.middleware.js`
  - **Infra:** `prisma/schema.prisma`, `prisma/seed.ts`, `docker-compose.yml`, `.env.example`, `DEPLOY.md`, `ARCHITECTURE_SPEC.md`
  - **Frontend:** `index.html`, `js/api.js`, `js/shell.js`, `js/icons.js`, `js/helpers.js`, `css/theme.css`, `pages/admin/*`
  - **Tests:** `tests/admin.test.js`, `tests/public.test.js`
  - **Responsable de:** aprobación de vacantes/empresas, gestión de usuarios, landing pública, cliente HTTP compartido, tema visual, seed de datos, esquema y arranque de la plataforma.

  ### 5.1 Matriz de propiedad — resumen

  | Carpeta / archivo | Owner |
  |---|---|
  | `backend/src/app.js`, `server.js`, `config/`, `db/`, `middleware/validate.*` | Carlos |
  | `backend/src/middleware/auth.middleware.js` | Brian |
  | `backend/src/{routes,controllers,services}/auth.*` | Brian |
  | `backend/src/{routes,controllers,services}/candidato.*` | Wilber |
  | `backend/src/{routes,controllers,services}/{empresa,vacantes}.*` | Walter |
  | `backend/src/{routes,controllers,services}/{admin,public}.*` | Carlos |
  | `prisma/`, `docker-compose.yml`, `.env.example`, docs raíz | Carlos |
  | `frontend/pages/candidato/*`, `busqueda.*`, `vacante.*` | Wilber |
  | `frontend/pages/empresa/*` | Walter |
  | `frontend/pages/admin/*` | Carlos |
  | `frontend/pages/login*.html`, `registro*.html`, `js/auth.js` | Brian |
  | `frontend/{index.html, css/, js/{api,shell,icons,helpers,index}.js}` | Carlos |

  ---

  ## 6. Entornos y Variables

  Regla única: **cada proceso lee la URL del entorno en el que corre. Nada se hardcodea.**

  | Variable | Valor en host (`.env`) | Valor en contenedor `api` (docker-compose) |
  |---|---|---|
  | `DATABASE_URL` | `postgresql://portal:portal_secret@localhost:5434/portal_db` | `postgresql://portal:portal_secret@db:5432/portal_db` |
  | `JWT_SECRET` | definido en `.env` | definido en `environment:` |
  | `PORT` | `3000` | `3000` |
  | `NODE_ENV` | `development` | `development` |

  - **Prisma CLI** (`db push`, `db seed`) se ejecuta siempre **desde el host** contra `localhost:5434`.
  - El **backend** puede correr en host (`npm run dev` con `.env`) o en contenedor (`docker compose up api`, que ignora `.env` y usa `environment:`).

  Consulta `DEPLOY.md` para el procedimiento completo de bootstrap.

  ---

  ## 7. Decisiones arquitectónicas clave (ADR resumido)

  | # | Decisión | Alternativa descartada | Motivo |
  |---|---|---|---|
  | ADR-01 | Express 5 + HTML vanilla | Next.js 14 (v1.0.0) | Reducir complejidad: sin bundler, sin SSR, cero hydration. Landing y páginas se entregan como HTML estático. |
  | ADR-02 | JWT manual | NextAuth.js | Stateless, portable, sin acoplamiento a frontend React. Control total sobre claims y expiración. |
  | ADR-03 | `pg` en runtime, Prisma solo para schema | Prisma Client en runtime | SQL explícito para reportes/agregaciones del admin. Evita sorpresas del query planner y reduce dependencias en el contenedor API. |
  | ADR-04 | Estructura por módulo (routes/controllers/services) | Colocalización tipo "feature folders" | Ownership claro por agente. Cada archivo tiene un dueño identificable. |
  | ADR-05 | `express-validator` en las rutas | Zod | Validación declarativa junto al endpoint, sin schemas compartidos con frontend (innecesarios aquí). |
  | ADR-06 | Split de `DATABASE_URL` entre `.env` y `docker-compose.environment` | `.env` único | Permite alternar entre backend en host y backend en contenedor sin tocar código. |

  ---

  ## 8. Convenciones de código

  - **Lenguaje:** JavaScript ES Modules (`"type": "module"` en `backend/package.json`). Todos los imports con extensión `.js`.
  - **Naming:** `modulo.routes.js`, `modulo.controller.js`, `modulo.service.js` — sin excepciones.
  - **SQL:** siempre parametrizado (`$1, $2, ...`), nunca interpolado. Enums en minúsculas alineados con `schema.prisma`.
  - **Respuestas HTTP:** JSON. Nunca enviar HTML desde rutas `/api`.
  - **Async:** `async/await` en controladores. Los `throw` suben al error handler global; no se hace `try/catch` local salvo para transformar un error.
  - **Tests:** Jest + Supertest, uno por módulo. Base de datos de test limpia entre `describe` (ver `tests/setup.js`).

  ---

  ## 9. Roadmap técnico (fuera del alcance v2.0.0)

  1. Mover el hashing de contraseñas a `argon2id` cuando `bcryptjs` quede obsoleto.
  2. Añadir índices a `vacancies(status, is_approved, created_at)` cuando el volumen lo justifique.
  3. Integrar un CDN para los estáticos de `frontend/` (hoy los sirve Express).
  4. Introducir rate-limit (`express-rate-limit`) en `/api/auth/login`.
  5. Reemplazar `pg.Pool` plano por `pg` + `PgBouncer` si escala la concurrencia.
