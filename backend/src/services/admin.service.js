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
  const status = aprobar ? 'activa' : 'cerrada';
  const { rows } = await pool.query(
    `UPDATE vacancies
     SET is_approved = $1, status = $2::vacancy_status, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [aprobar, status, vacancyId]
  );
  if (!rows[0]) throw makeError('Vacante no encontrada', 404);
  return rows[0];
};
