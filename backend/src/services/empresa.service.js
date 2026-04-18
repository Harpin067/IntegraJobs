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
