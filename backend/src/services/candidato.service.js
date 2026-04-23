// backend/src/services/candidato.service.js
import { pool } from '../db/db.js';
import crypto from 'crypto';

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
    `SELECT v.id FROM vacancies v
     WHERE v.id = $1 AND v.status = 'activa' AND v.is_approved = true`,
    [vacancyId]
  );
  if (!vac[0]) throw makeError('Vacante no encontrada o no disponible', 404);

  const { rows: userRows } = await pool.query(
    'SELECT cv_url FROM users WHERE id = $1', [userId]
  );
  const cvSnapshot = userRows[0]?.cv_url ?? 'sin-cv';

  try {
    const { rows } = await pool.query(
      `INSERT INTO applications (id, vacancy_id, user_id, cv_snapshot, mensaje, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [crypto.randomUUID(), vacancyId, userId, cvSnapshot, mensaje ?? null]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw makeError('Ya te has postulado a esta vacante', 409);
    throw err;
  }
};

export const subirAvatar = async (userId, avatarUrl) => {
  const { rows } = await pool.query(
    `UPDATE users SET avatar_url = $1, updated_at = NOW()
     WHERE id = $2 RETURNING id, avatar_url`,
    [avatarUrl, userId]
  );
  if (!rows[0]) throw makeError('Usuario no encontrado', 404);
  return rows[0];
};

export const subirCv = async (userId, filePath) => {
  const { rows } = await pool.query(
    `UPDATE users SET cv_url = $1, updated_at = NOW()
     WHERE id = $2 RETURNING id, cv_url`,
    [filePath, userId]
  );
  if (!rows[0]) throw makeError('Usuario no encontrado', 404);
  return rows[0];
};

export const misPostulaciones = async (userId) => {
  const { rows } = await pool.query(
    `SELECT a.*, v.titulo AS vacante_titulo, v.ubicacion AS vacante_ubicacion,
            c.id AS empresa_id, c.nombre AS empresa_nombre
     FROM applications a
     JOIN vacancies v ON v.id = a.vacancy_id
     JOIN companies c ON c.id = v.company_id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [userId]
  );
  return rows;
};

// ── Alertas ───────────────────────────────────────────────────────────
export const getAlertas = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

export const crearAlerta = async (userId, { keyword, ubicacion, tipoTrabajo }) => {
  const { rows } = await pool.query(
    `INSERT INTO alerts (id, user_id, keyword, ubicacion, tipo_trabajo)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [crypto.randomUUID(), userId, keyword, ubicacion ?? null, tipoTrabajo ?? null]
  );
  return rows[0];
};

export const toggleAlerta = async (alertId, userId) => {
  const { rows } = await pool.query(
    `UPDATE alerts SET is_active = NOT is_active
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [alertId, userId]
  );
  if (!rows[0]) throw makeError('Alerta no encontrada', 404);
  return rows[0];
};

export const eliminarAlerta = async (alertId, userId) => {
  const { rows } = await pool.query(
    `DELETE FROM alerts WHERE id = $1 AND user_id = $2 RETURNING id`,
    [alertId, userId]
  );
  if (!rows[0]) throw makeError('Alerta no encontrada', 404);
};

// ── Reviews / Valoraciones ────────────────────────────────────────────
export const crearReview = async (userId, companyId, { rating, comentario }) => {
  const { rows: comp } = await pool.query(
    `SELECT id FROM companies WHERE id = $1`, [companyId]
  );
  if (!comp[0]) throw makeError('Empresa no encontrada', 404);

  try {
    const { rows } = await pool.query(
      `INSERT INTO reviews (id, user_id, company_id, rating, comentario)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [crypto.randomUUID(), userId, companyId, rating, comentario]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw makeError('Ya valoraste esta empresa', 409);
    throw err;
  }
};

export const misReviews = async (userId) => {
  const { rows } = await pool.query(
    `SELECT r.*, c.nombre AS empresa_nombre
     FROM reviews r JOIN companies c ON c.id = r.company_id
     WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
    [userId]
  );
  return rows;
};

// ── Foros ─────────────────────────────────────────────────────────────
export const crearThread = async (userId, { categoryId, titulo, contenido }) => {
  const { rows: cat } = await pool.query(
    `SELECT id FROM forum_categories WHERE id = $1`, [categoryId]
  );
  if (!cat[0]) throw makeError('Categoría no encontrada', 404);

  const { rows } = await pool.query(
    `INSERT INTO forum_threads (id, category_id, user_id, titulo, contenido, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
    [crypto.randomUUID(), categoryId, userId, titulo, contenido]
  );
  return rows[0];
};

export const crearReply = async (userId, threadId, contenido) => {
  const { rows: th } = await pool.query(
    `SELECT id FROM forum_threads WHERE id = $1 AND is_approved = true`, [threadId]
  );
  if (!th[0]) throw makeError('Hilo no encontrado', 404);

  const { rows } = await pool.query(
    `INSERT INTO forum_replies (id, thread_id, user_id, contenido)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [crypto.randomUUID(), threadId, userId, contenido]
  );
  return rows[0];
};
