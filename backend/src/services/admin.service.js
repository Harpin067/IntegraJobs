// backend/src/services/admin.service.js
import { pool } from '../db/db.js';

const makeError = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

// ── Usuarios ──────────────────────────────────────────────
export const listarUsuarios = async () => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.nombre, u.apellidos, u.role, u.is_active, u.created_at,
            c.nombre AS empresa_nombre, c.is_verified AS empresa_verificada
     FROM users u
     LEFT JOIN companies c ON c.user_id = u.id
     ORDER BY u.created_at DESC`
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

// ── Empresas ──────────────────────────────────────────────
export const listarEmpresas = async () => {
  const { rows } = await pool.query(
    `SELECT c.*,
            u.email AS user_email,
            u.is_active AS user_activo,
            COUNT(DISTINCT v.id)::int   AS total_vacantes,
            COUNT(DISTINCT r.id)::int   AS total_valoraciones,
            ROUND(AVG(r.rating), 1)     AS rating_promedio
     FROM companies c
     JOIN  users u ON u.id = c.user_id
     LEFT JOIN vacancies v ON v.company_id = c.id
     LEFT JOIN reviews   r ON r.company_id = c.id AND r.is_approved = true
     GROUP BY c.id, u.email, u.is_active
     ORDER BY c.created_at DESC`
  );
  return rows;
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

// ── Vacantes ──────────────────────────────────────────────
export const vacantesPendientes = async () => {
  const { rows } = await pool.query(
    `SELECT v.*, c.nombre AS empresa_nombre, c.logo_url AS empresa_logo
     FROM vacancies v
     JOIN companies c ON c.id = v.company_id
     WHERE v.is_approved = false AND v.status NOT IN ('cerrada','rechazada')
     ORDER BY v.created_at ASC`
  );
  return rows;
};

export const aprobarVacante = async (vacancyId, aprobar) => {
  const status = aprobar ? 'activa' : 'rechazada';
  const { rows } = await pool.query(
    `UPDATE vacancies
     SET is_approved = $1, status = $2::"VacancyStatus", updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [aprobar, status, vacancyId]
  );
  if (!rows[0]) throw makeError('Vacante no encontrada', 404);
  return rows[0];
};

// ── Valoraciones ──────────────────────────────────────────
export const listarValoraciones = async () => {
  const { rows } = await pool.query(
    `SELECT r.*,
            c.nombre AS empresa_nombre,
            c.logo_url AS empresa_logo,
            u.nombre  AS usuario_nombre,
            u.apellidos AS usuario_apellidos,
            u.email   AS usuario_email
     FROM reviews r
     JOIN companies c ON c.id = r.company_id
     JOIN users    u ON u.id  = r.user_id
     ORDER BY r.created_at DESC`
  );
  return rows;
};

export const aprobarValoracion = async (reviewId, aprobar) => {
  const { rows } = await pool.query(
    `UPDATE reviews SET is_approved = $1
     WHERE id = $2 RETURNING *`,
    [aprobar, reviewId]
  );
  if (!rows[0]) throw makeError('Valoración no encontrada', 404);
  return rows[0];
};

// ── Foros ──────────────────────────────────────────────────
export const listarForoCategorias = async () => {
  const { rows } = await pool.query(
    `SELECT fc.*,
            COUNT(DISTINCT ft.id)::int AS total_threads,
            COUNT(DISTINCT fr.id)::int AS total_replies
     FROM forum_categories fc
     LEFT JOIN forum_threads ft ON ft.category_id = fc.id
     LEFT JOIN forum_replies fr ON fr.thread_id = ft.id
     GROUP BY fc.id ORDER BY fc.created_at ASC`
  );
  return rows;
};

export const crearForoCategoria = async (nombre, descripcion) => {
  const { rows } = await pool.query(
    `INSERT INTO forum_categories (id, nombre, descripcion)
     VALUES (gen_random_uuid(), $1, $2) RETURNING *`,
    [nombre, descripcion]
  );
  return rows[0];
};

export const eliminarForoCategoria = async (categoryId) => {
  const { rowCount } = await pool.query(
    `DELETE FROM forum_categories WHERE id = $1`, [categoryId]
  );
  if (!rowCount) throw makeError('Categoría no encontrada', 404);
};

export const listarForoThreads = async () => {
  const { rows } = await pool.query(
    `SELECT ft.id, ft.titulo, ft.contenido, ft.is_approved, ft.is_pinned, ft.created_at,
            fc.nombre AS categoria,
            u.nombre, u.apellidos, u.email,
            COUNT(fr.id)::int AS total_replies
     FROM forum_threads ft
     JOIN forum_categories fc ON fc.id = ft.category_id
     JOIN users u ON u.id = ft.user_id
     LEFT JOIN forum_replies fr ON fr.thread_id = ft.id
     GROUP BY ft.id, fc.nombre, u.nombre, u.apellidos, u.email
     ORDER BY ft.created_at DESC`
  );
  return rows;
};

export const moderarThread = async (threadId, aprobar) => {
  const { rows } = await pool.query(
    `UPDATE forum_threads SET is_approved = $1 WHERE id = $2 RETURNING *`,
    [aprobar, threadId]
  );
  if (!rows[0]) throw makeError('Hilo no encontrado', 404);
  return rows[0];
};

export const eliminarThread = async (threadId) => {
  const { rowCount } = await pool.query(
    `DELETE FROM forum_threads WHERE id = $1`, [threadId]
  );
  if (!rowCount) throw makeError('Hilo no encontrado', 404);
};
