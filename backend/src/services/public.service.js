// backend/src/services/public.service.js
import { pool } from '../db/db.js';

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
