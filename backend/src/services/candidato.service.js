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
