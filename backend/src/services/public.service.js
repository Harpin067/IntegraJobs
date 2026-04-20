// backend/src/services/public.service.js
import { pool } from '../db/db.js';

export const buscarVacantes = async ({ q, ubicacion, page = 1, limit = 20 } = {}) => {
  const conditions = [`v.status = 'activa'`, `v.is_approved = true`];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(v.titulo ILIKE $${params.length} OR v.descripcion ILIKE $${params.length})`);
  }
  if (ubicacion) {
    params.push(`%${ubicacion}%`);
    conditions.push(`v.ubicacion ILIKE $${params.length}`);
  }

  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    pool.query(
      `SELECT v.id, v.titulo, v.ubicacion, v.tipo_trabajo, v.tipo_contrato,
              v.salario_min, v.salario_max, v.experiencia, v.created_at,
              c.nombre AS empresa_nombre, c.logo_url AS empresa_logo
       FROM vacancies v
       JOIN companies c ON c.id = v.company_id
       WHERE ${where}
       ORDER BY v.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM vacancies v
       WHERE ${where.replace(/\$(\d+)/g, (_, n) => `$${n}`)}`,
      params.slice(0, -2)
    ),
  ]);

  return {
    data: dataRes.rows,
    total: countRes.rows[0].total,
    page: Number(page),
    limit: Number(limit),
  };
};

export const detalleVacante = async (id) => {
  const { rows } = await pool.query(
    `SELECT v.*,
            c.nombre       AS empresa_nombre,
            c.logo_url     AS empresa_logo,
            c.descripcion  AS empresa_descripcion,
            c.sitio_web    AS empresa_sitio,
            c.ubicacion    AS empresa_ubicacion,
            c.industria    AS empresa_industria,
            c.is_verified  AS empresa_verificada
     FROM vacancies v
     JOIN companies c ON c.id = v.company_id
     WHERE v.id = $1 AND v.status = 'activa' AND v.is_approved = true`,
    [id]
  );
  if (!rows[0]) {
    const err = new Error('Vacante no encontrada'); err.statusCode = 404; throw err;
  }
  return rows[0];
};

export const getLandingStats = async () => {
  const [vacantes, empresas, recientes, industrias] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total FROM vacancies WHERE status = 'activa' AND is_approved = true`
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM companies`
    ),
    pool.query(
      `SELECT v.id, v.titulo, v.ubicacion, v.tipo_trabajo, v.tipo_contrato,
              v.salario_min, v.salario_max, v.experiencia, v.created_at,
              c.nombre AS empresa_nombre, c.logo_url AS empresa_logo
       FROM vacancies v
       JOIN companies c ON c.id = v.company_id
       WHERE v.status = 'activa' AND v.is_approved = true
       ORDER BY v.created_at DESC
       LIMIT 6`
    ),
    pool.query(
      `SELECT industria, COUNT(*)::int AS total
       FROM companies
       GROUP BY industria
       ORDER BY total DESC
       LIMIT 4`
    ),
  ]);

  return {
    totalVacantes: vacantes.rows[0].total,
    totalEmpresas: empresas.rows[0].total,
    vacantesRecientes: recientes.rows,
    topIndustrias: industrias.rows,
  };
};
