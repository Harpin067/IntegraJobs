# ARCHITECTURE_SPEC.md — Portal de Trabajo

> **Versión:** 1.0.0 | **Fecha:** 2026-04-06
> **Autor:** Arquitectura de Software / Tech Lead
> **Estado:** Plan de ejecución definitivo para 4 agentes en paralelo

---

## 1. Stack Tecnologico

| Capa | Tecnologia | Justificacion |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + React 18 | SSR/SSG para SEO en landing y busqueda publica. App Router permite layouts anidados por modulo. |
| **Estilos** | Tailwind CSS 3 + shadcn/ui | Utilidad-first alineado a la paleta UX. shadcn/ui provee componentes accesibles y personalizables. |
| **Estado Global** | Zustand | Ligero, sin boilerplate, stores independientes por modulo para evitar colisiones entre agentes. |
| **Backend** | Next.js API Routes (Route Handlers) | Colocalizado con el frontend. Cada agente define sus endpoints dentro de su carpeta `app/api/`. |
| **ORM** | Prisma | Type-safe, migraciones declarativas, compatible con PostgreSQL. Esquema unico compartido. |
| **Base de Datos** | PostgreSQL 16 | Relacional, soporte nativo JSON para campos flexibles (requisitos de vacante, preferencias de alerta). |
| **Autenticacion** | NextAuth.js v5 (Auth.js) | Soporte multi-proveedor, sesiones JWT, callbacks de rol para candidato/empresa/admin. |
| **Almacenamiento** | Cloudinary o S3 | Para CVs (PDF/DOCX), logos de empresa e imagenes de perfil. |
| **Validacion** | Zod | Esquemas compartidos entre frontend y API para validacion end-to-end. |
| **Tipografia** | Inter (principal) + Roboto (fallback) | Segun prototipo. Importar via `next/font/google`. |

### 1.1 Paleta UX (Variables CSS Globales)

```css
:root {
  --color-primary: #1A56DB;    /* Azul Corporativo — botones principales, enlaces */
  --color-secondary: #10B981;  /* Verde Exito — "Aplicar", confirmaciones */
  --color-background: #F9FAFB; /* Gris Claro — fondo general */
  --color-text: #111827;       /* Gris Oscuro — texto principal */
  --color-danger: #EF4444;     /* Rojo Suave — errores, acciones destructivas */
}
```

Mapeo a Tailwind en `tailwind.config.ts`:

```ts
colors: {
  primary: '#1A56DB',
  secondary: '#10B981',
  background: '#F9FAFB',
  foreground: '#111827',
  danger: '#EF4444',
}
```

---

## 2. Estructura de Directorios (Aislamiento por Agente)

La estrategia es **Feature Modules dentro de App Router**. Cada agente trabaja exclusivamente en sus carpetas. Los archivos compartidos (`/shared`, `/prisma`, configuracion raiz) son propiedad del Agente 4 (Brian) y solo el puede modificarlos.

```
portal-trabajo/
├── prisma/                          # [BRIAN] Esquema unico de BD
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── public/
│   ├── fonts/
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # [BRIAN] Layout raiz (Header, Footer, Providers)
│   │   ├── page.tsx                 # [BRIAN] Landing page publica
│   │   ├── globals.css              # [BRIAN] Variables CSS, imports Tailwind
│   │   │
│   │   ├── (auth)/                  # [BRIAN] Grupo de rutas de autenticacion
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── registro/
│   │   │   │   ├── candidato/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── empresa/
│   │   │   │       └── page.tsx
│   │   │   └── recuperar/
│   │   │       └── page.tsx
│   │   │
│   │   ├── candidato/               # [WILBER] Modulo B2C completo
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # CAN-01-Dashboard
│   │   │   ├── busqueda/
│   │   │   │   └── page.tsx         # CAN-02-Busqueda
│   │   │   ├── resultados/
│   │   │   │   └── page.tsx         # CAN-03-Resultados
│   │   │   ├── oferta/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # CAN-04-DetalleOferta
│   │   │   ├── perfil/
│   │   │   │   └── page.tsx         # CAN-05-Perfil
│   │   │   ├── solicitudes/
│   │   │   │   └── page.tsx         # CAN-06-Solicitudes
│   │   │   ├── alertas/
│   │   │   │   └── page.tsx         # CAN-07-Alertas
│   │   │   ├── valoraciones/
│   │   │   │   └── page.tsx         # CAN-08-Valoraciones
│   │   │   ├── comunidad/
│   │   │   │   ├── page.tsx         # CAN-09-ForoListado
│   │   │   │   └── [threadId]/
│   │   │   │       └── page.tsx     # CAN-10-ForoDetalle
│   │   │   └── recursos/
│   │   │       └── page.tsx         # CAN-11-Recursos
│   │   │
│   │   ├── empresa/                 # [WALTER] Modulo B2B completo
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # EMP-01-Dashboard
│   │   │   ├── perfil/
│   │   │   │   └── page.tsx         # EMP-02-PerfilCorporativo
│   │   │   ├── vacantes/
│   │   │   │   ├── page.tsx         # EMP-03-ListadoVacantes
│   │   │   │   ├── nueva/
│   │   │   │   │   └── page.tsx     # EMP-04-PublicarVacante
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # EMP-05-DetalleVacante
│   │   │   │       └── editar/
│   │   │   │           └── page.tsx # EMP-06-EditarVacante
│   │   │   ├── postulaciones/
│   │   │   │   ├── page.tsx         # EMP-07-ATSListado
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # EMP-08-ATSDetalleCandidato
│   │   │   └── estadisticas/
│   │   │       └── page.tsx         # EMP-09-Estadisticas
│   │   │
│   │   ├── admin/                   # [CARLOS] Modulo Backoffice completo
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # ADM-01-DashboardGlobal
│   │   │   ├── usuarios/
│   │   │   │   ├── page.tsx         # ADM-02-GestionUsuarios
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # ADM-03-DetalleUsuario
│   │   │   ├── empresas/
│   │   │   │   ├── page.tsx         # ADM-04-GestionEmpresas
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # ADM-05-DetalleEmpresa
│   │   │   ├── vacantes/
│   │   │   │   ├── page.tsx         # ADM-06-GestionVacantes
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # ADM-07-DetalleVacante
│   │   │   ├── moderacion/
│   │   │   │   └── page.tsx         # ADM-08-ModeracionContenido
│   │   │   └── estadisticas/
│   │   │       └── page.tsx         # ADM-09-EstadisticasSistema
│   │   │
│   │   └── api/                     # API Routes por modulo
│   │       ├── auth/                # [BRIAN]
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── candidato/           # [WILBER]
│   │       │   ├── perfil/
│   │       │   │   └── route.ts
│   │       │   ├── busqueda/
│   │       │   │   └── route.ts
│   │       │   ├── solicitudes/
│   │       │   │   └── route.ts
│   │       │   ├── alertas/
│   │       │   │   └── route.ts
│   │       │   ├── valoraciones/
│   │       │   │   └── route.ts
│   │       │   └── comunidad/
│   │       │       └── route.ts
│   │       ├── empresa/             # [WALTER]
│   │       │   ├── perfil/
│   │       │   │   └── route.ts
│   │       │   ├── vacantes/
│   │       │   │   └── route.ts
│   │       │   ├── postulaciones/
│   │       │   │   └── route.ts
│   │       │   └── estadisticas/
│   │       │       └── route.ts
│   │       └── admin/               # [CARLOS]
│   │           ├── usuarios/
│   │           │   └── route.ts
│   │           ├── empresas/
│   │           │   └── route.ts
│   │           ├── vacantes/
│   │           │   └── route.ts
│   │           ├── moderacion/
│   │           │   └── route.ts
│   │           └── estadisticas/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── shared/                  # [BRIAN] Componentes transversales
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── StarRating.tsx
│   │   ├── candidato/               # [WILBER]
│   │   │   ├── CAN-JobCard.tsx
│   │   │   ├── CAN-FilterPanel.tsx
│   │   │   ├── CAN-ProfileForm.tsx
│   │   │   ├── CAN-CVUploader.tsx
│   │   │   ├── CAN-AlertList.tsx
│   │   │   ├── CAN-ReviewForm.tsx
│   │   │   ├── CAN-ForumThread.tsx
│   │   │   └── CAN-StatsPanel.tsx
│   │   ├── empresa/                 # [WALTER]
│   │   │   ├── EMP-CompanyProfile.tsx
│   │   │   ├── EMP-VacancyForm.tsx
│   │   │   ├── EMP-ApplicantTable.tsx
│   │   │   ├── EMP-ApplicantDetail.tsx
│   │   │   ├── EMP-StatsPanel.tsx
│   │   │   └── EMP-StatusBadge.tsx
│   │   └── admin/                   # [CARLOS]
│   │       ├── ADM-MetricsGrid.tsx
│   │       ├── ADM-UserTable.tsx
│   │       ├── ADM-CompanyTable.tsx
│   │       ├── ADM-VacancyTable.tsx
│   │       ├── ADM-ModerationQueue.tsx
│   │       ├── ADM-SystemCharts.tsx
│   │       └── ADM-ActionButtons.tsx
│   │
│   ├── lib/                         # [BRIAN] Utilidades compartidas
│   │   ├── prisma.ts                # Singleton de PrismaClient
│   │   ├── auth.ts                  # Configuracion NextAuth
│   │   ├── validations/             # Esquemas Zod compartidos
│   │   │   ├── user.ts
│   │   │   ├── vacancy.ts
│   │   │   ├── application.ts
│   │   │   └── review.ts
│   │   └── utils.ts                 # Helpers (formatDate, cn, etc.)
│   │
│   ├── stores/                      # Zustand stores
│   │   ├── authStore.ts             # [BRIAN]
│   │   ├── candidatoStore.ts        # [WILBER]
│   │   ├── empresaStore.ts          # [WALTER]
│   │   └── adminStore.ts            # [CARLOS]
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useAuth.ts               # [BRIAN]
│   │   ├── useBusqueda.ts           # [WILBER]
│   │   ├── useVacantes.ts           # [WALTER]
│   │   └── useAdminData.ts          # [CARLOS]
│   │
│   ├── types/                       # [BRIAN] Tipos TypeScript globales
│   │   └── index.ts
│   │
│   └── middleware.ts                 # [BRIAN] Proteccion de rutas por rol
│
├── .eslintrc.json                   # [BRIAN]
├── .prettierrc                      # [BRIAN]
├── tailwind.config.ts               # [BRIAN]
├── tsconfig.json                    # [BRIAN]
├── next.config.ts                   # [BRIAN]
├── package.json                     # [BRIAN]
└── .env.local                       # [BRIAN] Variables de entorno (NO committear)
```

### 2.1 Regla de Propiedad de Archivos

| Carpeta / Archivo | Propietario | Otros pueden leer | Otros pueden modificar |
|---|---|---|---|
| `prisma/*` | Brian | Si | NO — solicitar al propietario |
| `src/app/(auth)/*` | Brian | Si | NO |
| `src/app/candidato/*` | Wilber | Si | NO |
| `src/app/empresa/*` | Walter | Si | NO |
| `src/app/admin/*` | Carlos | Si | NO |
| `src/components/shared/*` | Brian | Si | NO — solicitar al propietario |
| `src/components/candidato/*` | Wilber | Si | NO |
| `src/components/empresa/*` | Walter | Si | NO |
| `src/components/admin/*` | Carlos | Si | NO |
| `src/lib/*` | Brian | Si | NO — solicitar al propietario |
| `src/stores/authStore.ts` | Brian | Si | NO |
| `src/stores/candidatoStore.ts` | Wilber | Si | NO |
| `src/stores/empresaStore.ts` | Walter | Si | NO |
| `src/stores/adminStore.ts` | Carlos | Si | NO |
| `middleware.ts` | Brian | Si | NO |
| Archivos raiz de config | Brian | Si | NO |

**Si un agente necesita un cambio en un archivo que no es suyo, debe crear un Issue o comunicarse con el propietario. Nunca editar directamente.**

---

## 3. Esquema de Base de Datos (Diagrama Logico)

```
┌──────────────────────────────┐
│           users              │
├──────────────────────────────┤
│ id            UUID PK        │
│ email         VARCHAR UNIQUE │
│ password_hash VARCHAR        │
│ role          ENUM(candidato,│
│               empresa,admin) │
│ nombre        VARCHAR        │
│ apellidos     VARCHAR        │
│ telefono      VARCHAR NULL   │
│ avatar_url    VARCHAR NULL   │
│ cv_url        VARCHAR NULL   │
│ is_active     BOOLEAN        │
│ created_at    TIMESTAMP      │
│ updated_at    TIMESTAMP      │
└──────────┬───────────────────┘
           │
           │ 1:1 (role=empresa)
           ▼
┌──────────────────────────────┐
│         companies            │
├──────────────────────────────┤
│ id            UUID PK        │
│ user_id       UUID FK→users  │
│ nombre        VARCHAR        │
│ descripcion   TEXT           │
│ logo_url      VARCHAR NULL   │
│ sitio_web     VARCHAR NULL   │
│ ubicacion     VARCHAR        │
│ industria     VARCHAR        │
│ is_verified   BOOLEAN        │
│ created_at    TIMESTAMP      │
│ updated_at    TIMESTAMP      │
└──────────┬───────────────────┘
           │
           │ 1:N
           ▼
┌──────────────────────────────┐
│         vacancies            │
├──────────────────────────────┤
│ id            UUID PK        │
│ company_id    UUID FK→co...  │
│ titulo        VARCHAR        │
│ descripcion   TEXT           │
│ requisitos    TEXT           │
│ ubicacion     VARCHAR        │
│ tipo_trabajo  ENUM(presencial│
│   ,remoto,hibrido)           │
│ tipo_contrato ENUM(completo, │
│   medio,temporal,freelance)  │
│ salario_min   DECIMAL NULL   │
│ salario_max   DECIMAL NULL   │
│ experiencia   ENUM(junior,   │
│   mid,senior,lead)           │
│ contacto      VARCHAR        │
│ status        ENUM(activa,   │
│   pausada,cerrada,rechazada) │
│ is_approved   BOOLEAN        │
│ created_at    TIMESTAMP      │
│ updated_at    TIMESTAMP      │
└──────────┬───────────────────┘
           │
           │ 1:N
           ▼
┌──────────────────────────────┐
│       applications           │
├──────────────────────────────┤
│ id            UUID PK        │
│ vacancy_id    UUID FK→vac... │
│ user_id       UUID FK→users  │
│ status        ENUM(nuevo,    │
│   en_proceso,rechazado,      │
│   contratado)                │
│ cv_snapshot   VARCHAR        │
│ mensaje       TEXT NULL      │
│ created_at    TIMESTAMP      │
│ updated_at    TIMESTAMP      │
└──────────────────────────────┘

┌──────────────────────────────┐
│          reviews             │
├──────────────────────────────┤
│ id            UUID PK        │
│ user_id       UUID FK→users  │
│ company_id    UUID FK→co...  │
│ rating        INT (1-5)      │
│ comentario    TEXT            │
│ is_approved   BOOLEAN        │
│ created_at    TIMESTAMP      │
└──────────────────────────────┘

┌──────────────────────────────┐
│          alerts              │
├──────────────────────────────┤
│ id            UUID PK        │
│ user_id       UUID FK→users  │
│ keyword       VARCHAR        │
│ ubicacion     VARCHAR NULL   │
│ tipo_trabajo  VARCHAR NULL   │
│ is_active     BOOLEAN        │
│ created_at    TIMESTAMP      │
└──────────────────────────────┘

┌──────────────────────────────┐
│       forum_categories       │
├──────────────────────────────┤
│ id            UUID PK        │
│ nombre        VARCHAR        │
│ descripcion   TEXT           │
│ created_at    TIMESTAMP      │
└──────────────────────────────┘

┌──────────────────────────────┐
│       forum_threads          │
├──────────────────────────────┤
│ id            UUID PK        │
│ category_id   UUID FK→f_c... │
│ user_id       UUID FK→users  │
│ titulo        VARCHAR        │
│ contenido     TEXT           │
│ is_pinned     BOOLEAN        │
│ is_approved   BOOLEAN        │
│ created_at    TIMESTAMP      │
│ updated_at    TIMESTAMP      │
└──────────┬───────────────────┘
           │ 1:N
           ▼
┌──────────────────────────────┐
│       forum_replies          │
├──────────────────────────────┤
│ id            UUID PK        │
│ thread_id     UUID FK→f_t... │
│ user_id       UUID FK→users  │
│ contenido     TEXT           │
│ is_approved   BOOLEAN        │
│ created_at    TIMESTAMP      │
└──────────────────────────────┘

┌──────────────────────────────┐
│        resources             │
├──────────────────────────────┤
│ id            UUID PK        │
│ titulo        VARCHAR        │
│ contenido     TEXT           │
│ tipo          ENUM(articulo, │
│   tutorial,video)            │
│ imagen_url    VARCHAR NULL   │
│ is_published  BOOLEAN        │
│ created_at    TIMESTAMP      │
│ updated_at    TIMESTAMP      │
└──────────────────────────────┘
```

### 3.1 Prisma Schema (Referencia)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  candidato
  empresa
  admin
}

enum TipoTrabajo {
  presencial
  remoto
  hibrido
}

enum TipoContrato {
  completo
  medio
  temporal
  freelance
}

enum Experiencia {
  junior
  mid
  senior
  lead
}

enum VacancyStatus {
  activa
  pausada
  cerrada
  rechazada
}

enum ApplicationStatus {
  nuevo
  en_proceso
  rechazado
  contratado
}

enum ResourceType {
  articulo
  tutorial
  video
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         Role
  nombre       String
  apellidos    String
  telefono     String?
  avatarUrl    String?  @map("avatar_url")
  cvUrl        String?  @map("cv_url")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  company      Company?
  applications Application[]
  reviews      Review[]
  alerts       Alert[]
  threads      ForumThread[]
  replies      ForumReply[]

  @@map("users")
}

model Company {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")
  nombre      String
  descripcion String
  logoUrl     String?  @map("logo_url")
  sitioWeb    String?  @map("sitio_web")
  ubicacion   String
  industria   String
  isVerified  Boolean  @default(false) @map("is_verified")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id])
  vacancies   Vacancy[]
  reviews     Review[]

  @@map("companies")
}

model Vacancy {
  id           String        @id @default(uuid())
  companyId    String        @map("company_id")
  titulo       String
  descripcion  String
  requisitos   String
  ubicacion    String
  tipoTrabajo  TipoTrabajo   @map("tipo_trabajo")
  tipoContrato TipoContrato  @map("tipo_contrato")
  salarioMin   Decimal?      @map("salario_min")
  salarioMax   Decimal?      @map("salario_max")
  experiencia  Experiencia
  contacto     String
  status       VacancyStatus @default(activa)
  isApproved   Boolean       @default(false) @map("is_approved")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  company      Company       @relation(fields: [companyId], references: [id])
  applications Application[]

  @@map("vacancies")
}

model Application {
  id         String            @id @default(uuid())
  vacancyId  String            @map("vacancy_id")
  userId     String            @map("user_id")
  status     ApplicationStatus @default(nuevo)
  cvSnapshot String            @map("cv_snapshot")
  mensaje    String?
  createdAt  DateTime          @default(now()) @map("created_at")
  updatedAt  DateTime          @updatedAt @map("updated_at")

  vacancy    Vacancy           @relation(fields: [vacancyId], references: [id])
  user       User              @relation(fields: [userId], references: [id])

  @@unique([vacancyId, userId])
  @@map("applications")
}

model Review {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  companyId  String   @map("company_id")
  rating     Int
  comentario String
  isApproved Boolean  @default(false) @map("is_approved")
  createdAt  DateTime @default(now()) @map("created_at")

  user       User     @relation(fields: [userId], references: [id])
  company    Company  @relation(fields: [companyId], references: [id])

  @@unique([userId, companyId])
  @@map("reviews")
}

model Alert {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  keyword     String
  ubicacion   String?
  tipoTrabajo String?  @map("tipo_trabajo")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id])

  @@map("alerts")
}

model ForumCategory {
  id          String        @id @default(uuid())
  nombre      String
  descripcion String
  createdAt   DateTime      @default(now()) @map("created_at")

  threads     ForumThread[]

  @@map("forum_categories")
}

model ForumThread {
  id          String        @id @default(uuid())
  categoryId  String        @map("category_id")
  userId      String        @map("user_id")
  titulo      String
  contenido   String
  isPinned    Boolean       @default(false) @map("is_pinned")
  isApproved  Boolean       @default(true) @map("is_approved")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  category    ForumCategory @relation(fields: [categoryId], references: [id])
  user        User          @relation(fields: [userId], references: [id])
  replies     ForumReply[]

  @@map("forum_threads")
}

model ForumReply {
  id         String      @id @default(uuid())
  threadId   String      @map("thread_id")
  userId     String      @map("user_id")
  contenido  String
  isApproved Boolean     @default(true) @map("is_approved")
  createdAt  DateTime    @default(now()) @map("created_at")

  thread     ForumThread @relation(fields: [threadId], references: [id])
  user       User        @relation(fields: [userId], references: [id])

  @@map("forum_replies")
}

model Resource {
  id          String       @id @default(uuid())
  titulo      String
  contenido   String
  tipo        ResourceType
  imagenUrl   String?      @map("imagen_url")
  isPublished Boolean      @default(false) @map("is_published")
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  @@map("resources")
}
```

---

## 4. Contratos de API (Endpoints por Modulo)

### Convenciones Globales

- Base URL: `/api`
- Formato: JSON
- Autenticacion: Bearer JWT via NextAuth session
- Errores: `{ error: string, code: number }`
- Paginacion: `?page=1&limit=20` → `{ data: T[], total: number, page: number, totalPages: number }`

---

### 4.1 BRIAN — Autenticacion (`/api/auth`)

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Registro de candidato o empresa | No |
| POST | `/api/auth/[...nextauth]` | Login/logout (gestionado por NextAuth) | No |
| POST | `/api/auth/forgot-password` | Solicitar recuperacion de contrasena | No |
| POST | `/api/auth/reset-password` | Resetear contrasena con token | No |
| GET | `/api/auth/session` | Obtener sesion actual | Si |

**POST `/api/auth/register`**
```ts
// Request
{
  email: string,
  password: string,
  nombre: string,
  apellidos: string,
  role: "candidato" | "empresa",
  // Si role === "empresa":
  companyData?: {
    nombre: string,
    descripcion: string,
    ubicacion: string,
    industria: string,
    sitioWeb?: string
  }
}
// Response 201
{ user: { id, email, role, nombre }, token: string }
```

---

### 4.2 WILBER — Candidato (`/api/candidato`)

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/api/candidato/perfil` | Obtener perfil del candidato logueado | Candidato |
| PUT | `/api/candidato/perfil` | Actualizar datos personales | Candidato |
| POST | `/api/candidato/perfil/cv` | Subir CV (PDF/DOCX) | Candidato |
| GET | `/api/candidato/busqueda` | Buscar vacantes con filtros | No* |
| GET | `/api/candidato/busqueda/[id]` | Detalle de una vacante | No* |
| POST | `/api/candidato/solicitudes` | Aplicar a una vacante | Candidato |
| GET | `/api/candidato/solicitudes` | Listar mis solicitudes | Candidato |
| GET | `/api/candidato/alertas` | Listar mis alertas | Candidato |
| POST | `/api/candidato/alertas` | Crear alerta de empleo | Candidato |
| PUT | `/api/candidato/alertas/[id]` | Activar/desactivar alerta | Candidato |
| DELETE | `/api/candidato/alertas/[id]` | Eliminar alerta | Candidato |
| GET | `/api/candidato/valoraciones` | Listar valoraciones del usuario | Candidato |
| POST | `/api/candidato/valoraciones` | Crear valoracion de empresa | Candidato |
| GET | `/api/candidato/comunidad` | Listar hilos del foro | No* |
| POST | `/api/candidato/comunidad` | Crear hilo en el foro | Candidato |
| GET | `/api/candidato/comunidad/[threadId]` | Detalle de hilo + respuestas | No* |
| POST | `/api/candidato/comunidad/[threadId]/reply` | Responder a un hilo | Candidato |

> *No* = accesible sin auth para lectura publica, pero con auth retorna datos personalizados.

**GET `/api/candidato/busqueda`**
```ts
// Query params
{
  q?: string,           // palabra clave
  ubicacion?: string,
  tipoTrabajo?: "presencial" | "remoto" | "hibrido",
  tipoContrato?: "completo" | "medio" | "temporal" | "freelance",
  experiencia?: "junior" | "mid" | "senior" | "lead",
  salarioMin?: number,
  salarioMax?: number,
  page?: number,
  limit?: number
}
// Response 200
{
  data: Vacancy[],
  total: number,
  page: number,
  totalPages: number
}
```

**POST `/api/candidato/solicitudes`**
```ts
// Request
{ vacancyId: string, mensaje?: string }
// Response 201
{ application: { id, status, createdAt } }
```

---

### 4.3 WALTER — Empresa (`/api/empresa`)

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/api/empresa/perfil` | Obtener perfil corporativo | Empresa |
| PUT | `/api/empresa/perfil` | Actualizar datos de empresa | Empresa |
| POST | `/api/empresa/perfil/logo` | Subir logo de empresa | Empresa |
| GET | `/api/empresa/vacantes` | Listar vacantes propias | Empresa |
| POST | `/api/empresa/vacantes` | Crear nueva vacante | Empresa |
| GET | `/api/empresa/vacantes/[id]` | Detalle de vacante propia | Empresa |
| PUT | `/api/empresa/vacantes/[id]` | Editar vacante | Empresa |
| DELETE | `/api/empresa/vacantes/[id]` | Eliminar/cerrar vacante | Empresa |
| GET | `/api/empresa/postulaciones` | Listar postulaciones recibidas | Empresa |
| GET | `/api/empresa/postulaciones/[id]` | Detalle de un candidato postulado | Empresa |
| PUT | `/api/empresa/postulaciones/[id]` | Cambiar status de postulacion | Empresa |
| GET | `/api/empresa/estadisticas` | Metricas de la empresa | Empresa |

**POST `/api/empresa/vacantes`**
```ts
// Request
{
  titulo: string,
  descripcion: string,
  requisitos: string,
  ubicacion: string,
  tipoTrabajo: "presencial" | "remoto" | "hibrido",
  tipoContrato: "completo" | "medio" | "temporal" | "freelance",
  salarioMin?: number,
  salarioMax?: number,
  experiencia: "junior" | "mid" | "senior" | "lead",
  contacto: string
}
// Response 201
{ vacancy: { id, titulo, status, createdAt } }
```

**PUT `/api/empresa/postulaciones/[id]`**
```ts
// Request
{ status: "nuevo" | "en_proceso" | "rechazado" | "contratado" }
// Response 200
{ application: { id, status, updatedAt } }
```

**GET `/api/empresa/estadisticas`**
```ts
// Response 200
{
  totalVacantes: number,
  vacantesActivas: number,
  totalPostulaciones: number,
  postulacionesPorStatus: { nuevo: number, en_proceso: number, rechazado: number, contratado: number },
  postulacionesPorMes: { mes: string, total: number }[]
}
```

---

### 4.4 CARLOS — Admin (`/api/admin`)

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/api/admin/estadisticas` | Dashboard global de metricas | Admin |
| GET | `/api/admin/usuarios` | Listar todos los usuarios (paginado) | Admin |
| GET | `/api/admin/usuarios/[id]` | Detalle de usuario | Admin |
| PUT | `/api/admin/usuarios/[id]` | Editar/bloquear usuario | Admin |
| DELETE | `/api/admin/usuarios/[id]` | Desactivar usuario | Admin |
| GET | `/api/admin/empresas` | Listar todas las empresas | Admin |
| GET | `/api/admin/empresas/[id]` | Detalle de empresa | Admin |
| PUT | `/api/admin/empresas/[id]` | Editar/verificar empresa | Admin |
| DELETE | `/api/admin/empresas/[id]` | Desactivar empresa | Admin |
| GET | `/api/admin/vacantes` | Listar todas las vacantes | Admin |
| PUT | `/api/admin/vacantes/[id]` | Aprobar/rechazar vacante | Admin |
| DELETE | `/api/admin/vacantes/[id]` | Eliminar vacante | Admin |
| GET | `/api/admin/moderacion` | Cola de contenido pendiente | Admin |
| PUT | `/api/admin/moderacion/[id]` | Aprobar/rechazar contenido | Admin |

**GET `/api/admin/estadisticas`**
```ts
// Response 200
{
  totalUsuarios: number,
  totalEmpresas: number,
  totalVacantes: number,
  totalSolicitudes: number,
  usuariosNuevosMes: number,
  vacantesActivasVsCerradas: { activas: number, cerradas: number },
  postulacionesPorMes: { mes: string, total: number }[],
  contenidoPendiente: number
}
```

**PUT `/api/admin/moderacion/[id]`**
```ts
// Request
{
  tipo: "review" | "thread" | "reply",
  accion: "aprobar" | "rechazar",
  motivo?: string
}
// Response 200
{ success: true }
```

---

## 5. Flujo de Git y Reglas de Commits

### 5.1 Estrategia de Branching

```
main                          ← Produccion. Solo recibe merges via PR aprobado.
 └── develop                  ← Integracion. Cada agente hace PR aqui.
      ├── feature/brian/...   ← Ramas de Brian
      ├── feature/wilber/...  ← Ramas de Wilber
      ├── feature/walter/...  ← Ramas de Walter
      └── feature/carlos/...  ← Ramas de Carlos
```

### 5.2 Convencion de Nombres de Ramas

```
feature/<agente>/<modulo>-<descripcion>
```

Ejemplos:
- `feature/brian/auth-login-registro`
- `feature/wilber/can-busqueda-filtros`
- `feature/walter/emp-publicar-vacante`
- `feature/carlos/adm-crud-usuarios`

### 5.3 Conventional Commits

Formato obligatorio:

```
<tipo>(<modulo>): <descripcion corta>

[cuerpo opcional]

[footer opcional]
```

**Tipos permitidos:**

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Correccion de bug |
| `style` | Cambios de estilo/CSS (sin logica) |
| `refactor` | Refactorizacion sin cambiar funcionalidad |
| `docs` | Documentacion |
| `chore` | Configuracion, dependencias, scripts |
| `test` | Tests |

**Modulos permitidos:**

| Modulo | Agente |
|---|---|
| `auth` | Brian |
| `layout` | Brian |
| `config` | Brian |
| `db` | Brian |
| `can` | Wilber |
| `emp` | Walter |
| `adm` | Carlos |

Ejemplos:
```
feat(auth): agregar flujo de registro multi-rol
feat(can): implementar filtros avanzados de busqueda
fix(emp): corregir validacion en formulario de vacante
style(adm): ajustar paleta de colores en dashboard
chore(config): agregar dependencia de shadcn/ui
```

### 5.4 Reglas de Pull Request

1. **Destino:** Siempre hacia `develop`, nunca directo a `main`.
2. **Titulo del PR:** Mismo formato que commits: `feat(can): dashboard de candidato`.
3. **Descripcion:** Incluir lista de pantallas afectadas con su nomenclatura (ej. CAN-01, EMP-03).
4. **Review obligatorio:** Al menos 1 aprobacion de otro agente. Si el PR toca `shared/` o `prisma/`, Brian debe aprobar.
5. **CI debe pasar:** Linting + build + tests antes de merge.
6. **Squash merge:** Usar squash merge para mantener historial limpio en `develop`.

### 5.5 Flujo de Trabajo Diario

```
1. git checkout develop && git pull origin develop
2. git checkout -b feature/<agente>/<descripcion>
3. Trabajar en commits atomicos siguiendo la convencion
4. git push origin feature/<agente>/<descripcion>
5. Crear PR hacia develop
6. Esperar review + CI
7. Merge (squash)
8. Eliminar rama remota
```

### 5.6 Resolucion de Conflictos

- Si hay conflicto al hacer merge a `develop`, el agente que creo el PR es responsable de resolverlo en su rama.
- Conflictos en `prisma/schema.prisma` o `src/lib/*`: coordinar con Brian antes de resolver.
- Conflictos en `package.json`: resolver manteniendo ambas dependencias y ejecutar `npm install` para regenerar el lock file.

---

## 6. Middleware de Autorizacion

```ts
// src/middleware.ts — [BRIAN]

const publicRoutes = ['/', '/api/auth', '/api/candidato/busqueda', '/api/candidato/comunidad'];
const candidatoRoutes = ['/candidato', '/api/candidato'];
const empresaRoutes = ['/empresa', '/api/empresa'];
const adminRoutes = ['/admin', '/api/admin'];

// Logica:
// 1. Si ruta es publica → permitir
// 2. Si no hay sesion → redirect a /login
// 3. Si rol no coincide con la ruta → redirect a su dashboard
// 4. Si admin intenta cualquier ruta → permitir (superusuario)
```

---

## 7. Nomenclatura de Pantallas (Referencia Completa)

| Codigo | Pantalla | Agente |
|---|---|---|
| **PUB-01** | Landing Page | Brian |
| **PUB-02** | Login | Brian |
| **PUB-03** | Registro Candidato | Brian |
| **PUB-04** | Registro Empresa | Brian |
| **PUB-05** | Recuperar Contrasena | Brian |
| **CAN-01** | Dashboard Candidato | Wilber |
| **CAN-02** | Busqueda de Empleo | Wilber |
| **CAN-03** | Resultados de Busqueda | Wilber |
| **CAN-04** | Detalle de Oferta | Wilber |
| **CAN-05** | Perfil / Datos Personales | Wilber |
| **CAN-06** | Mis Solicitudes | Wilber |
| **CAN-07** | Alertas de Empleo | Wilber |
| **CAN-08** | Valoraciones de Empresas | Wilber |
| **CAN-09** | Foro - Listado | Wilber |
| **CAN-10** | Foro - Detalle de Hilo | Wilber |
| **CAN-11** | Recursos y Consejos | Wilber |
| **EMP-01** | Dashboard Empresa | Walter |
| **EMP-02** | Perfil Corporativo | Walter |
| **EMP-03** | Listado de Vacantes | Walter |
| **EMP-04** | Publicar Vacante | Walter |
| **EMP-05** | Detalle de Vacante | Walter |
| **EMP-06** | Editar Vacante | Walter |
| **EMP-07** | ATS - Listado Postulaciones | Walter |
| **EMP-08** | ATS - Detalle Candidato | Walter |
| **EMP-09** | Estadisticas de Empresa | Walter |
| **ADM-01** | Dashboard Global | Carlos |
| **ADM-02** | Gestion de Usuarios | Carlos |
| **ADM-03** | Detalle de Usuario | Carlos |
| **ADM-04** | Gestion de Empresas | Carlos |
| **ADM-05** | Detalle de Empresa | Carlos |
| **ADM-06** | Gestion de Vacantes | Carlos |
| **ADM-07** | Detalle de Vacante (Admin) | Carlos |
| **ADM-08** | Moderacion de Contenido | Carlos |
| **ADM-09** | Estadisticas del Sistema | Carlos |

---

## 8. Orden de Ejecucion Recomendado

### Fase 0 — Setup (Brian, Dia 1)
1. Inicializar repositorio Next.js con TypeScript
2. Configurar Tailwind + shadcn/ui + paleta de colores
3. Configurar Prisma + PostgreSQL + ejecutar migraciones iniciales
4. Configurar NextAuth con registro multi-rol
5. Crear layout global (Header, Footer, Sidebar)
6. Crear middleware de proteccion de rutas
7. Crear componentes `shared/` base
8. Push a `develop` — los demas agentes clonan a partir de aqui

### Fase 1 — Modulos Independientes (Todos, Dias 2-5)
- **Wilber:** CAN-01 a CAN-05 (Dashboard, Busqueda, Resultados, Detalle, Perfil)
- **Walter:** EMP-01 a EMP-04 (Dashboard, Perfil Corp., Listado, Publicar)
- **Carlos:** ADM-01, ADM-02, ADM-04 (Dashboard, CRUD Usuarios, CRUD Empresas)
- **Brian:** PUB-01 a PUB-05 (Landing, Login, Registros, Recuperar)

### Fase 2 — Funcionalidad Cruzada (Todos, Dias 6-8)
- **Wilber:** CAN-06 a CAN-11 (Solicitudes, Alertas, Valoraciones, Foro, Recursos)
- **Walter:** EMP-05 a EMP-09 (Detalle, Editar, ATS, Estadisticas)
- **Carlos:** ADM-05 a ADM-09 (Detalles, Moderacion, Estadisticas)
- **Brian:** Integracion, testing E2E, ajustes de navegacion

### Fase 3 — Integracion y QA (Todos, Dias 9-10)
1. Merge final de todas las ramas a `develop`
2. Testing de flujos completos cross-modulo
3. Merge `develop` → `main`
4. Deploy

---

> **Este documento es el contrato de trabajo del equipo. Cualquier desviacion debe ser discutida y aprobada antes de implementarse.**
