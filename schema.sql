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
  CONSTRAINT chk_salario CHECK (salario_min IS NULL OR salario_max IS NULL OR salario_min <= salario_max),
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
  tipo_trabajo tipo_trabajo,
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
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
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
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
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
CREATE INDEX idx_alerts_user ON alerts(user_id) WHERE is_active = true;
