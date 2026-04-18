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
