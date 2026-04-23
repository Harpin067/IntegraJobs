// backend/src/services/public.service.js
import { pool } from '../db/db.js';

const makeError = (msg, code) => { const e = new Error(msg); e.statusCode = code; return e; };

export const buscarVacantes = async ({ q, ubicacion, tipoTrabajo, tipoContrato, experiencia, salarioMin, salarioMax, page = 1, limit = 20 } = {}) => {
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
  if (tipoTrabajo)  { params.push(tipoTrabajo);  conditions.push(`v.tipo_trabajo = $${params.length}::"TipoTrabajo"`); }
  if (tipoContrato) { params.push(tipoContrato); conditions.push(`v.tipo_contrato = $${params.length}::"TipoContrato"`); }
  if (experiencia)  { params.push(experiencia);  conditions.push(`v.experiencia = $${params.length}::"Experiencia"`); }
  if (salarioMin)   { params.push(Number(salarioMin)); conditions.push(`v.salario_min >= $${params.length}`); }
  if (salarioMax)   { params.push(Number(salarioMax)); conditions.push(`v.salario_max <= $${params.length}`); }

  const offset = (Number(page) - 1) * Number(limit);
  const baseParams = [...params];
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
      `SELECT COUNT(*)::int AS total FROM vacancies v WHERE ${where}`,
      baseParams
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
            c.id           AS empresa_id,
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
  if (!rows[0]) throw makeError('Vacante no encontrada', 404);
  return rows[0];
};

export const getLandingStats = async () => {
  const [vacantes, empresas, usuarios, solicitudes, recientes, industrias] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM vacancies WHERE status = 'activa' AND is_approved = true`),
    pool.query(`SELECT COUNT(*)::int AS total FROM companies`),
    pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'CANDIDATO'`),
    pool.query(`SELECT COUNT(*)::int AS total FROM applications`),
    pool.query(
      `SELECT v.id, v.titulo, v.ubicacion, v.tipo_trabajo, v.tipo_contrato,
              v.salario_min, v.salario_max, v.experiencia, v.created_at,
              c.nombre AS empresa_nombre, c.logo_url AS empresa_logo
       FROM vacancies v
       JOIN companies c ON c.id = v.company_id
       WHERE v.status = 'activa' AND v.is_approved = true
       ORDER BY v.created_at DESC LIMIT 6`
    ),
    pool.query(
      `SELECT industria, COUNT(*)::int AS total FROM companies GROUP BY industria ORDER BY total DESC LIMIT 4`
    ),
  ]);

  return {
    totalVacantes:  vacantes.rows[0].total,
    totalEmpresas:  empresas.rows[0].total,
    totalUsuarios:  usuarios.rows[0].total,
    totalSolicitudes: solicitudes.rows[0].total,
    vacantesRecientes: recientes.rows,
    topIndustrias:  industrias.rows,
  };
};

// ── Recursos ──────────────────────────────────────────────────────────
export const getRecursos = async (tipo) => {
  const params = [];
  let where = `is_published = true`;
  if (tipo) { params.push(tipo); where += ` AND tipo = $${params.length}::"ResourceType"`; }
  const { rows } = await pool.query(
    `SELECT id, titulo, contenido, tipo, imagen_url, created_at
     FROM resources WHERE ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
};

// ── Foros ─────────────────────────────────────────────────────────────
export const getForoCategories = async () => {
  const { rows } = await pool.query(
    `SELECT fc.*, COUNT(ft.id)::int AS total_threads
     FROM forum_categories fc
     LEFT JOIN forum_threads ft ON ft.category_id = fc.id AND ft.is_approved = true
     GROUP BY fc.id ORDER BY fc.created_at ASC`
  );
  return rows;
};

export const getForoThreads = async (categoryId) => {
  const { rows } = await pool.query(
    `SELECT ft.id, ft.titulo, ft.contenido, ft.is_pinned, ft.created_at,
            u.nombre, u.apellidos,
            COUNT(fr.id)::int AS total_replies
     FROM forum_threads ft
     JOIN users u ON u.id = ft.user_id
     LEFT JOIN forum_replies fr ON fr.thread_id = ft.id AND fr.is_approved = true
     WHERE ft.category_id = $1 AND ft.is_approved = true
     GROUP BY ft.id, u.nombre, u.apellidos
     ORDER BY ft.is_pinned DESC, ft.created_at DESC`,
    [categoryId]
  );
  return rows;
};

export const getForoThread = async (threadId) => {
  const [thread, replies] = await Promise.all([
    pool.query(
      `SELECT ft.*, fc.nombre AS categoria, u.nombre AS autor_nombre, u.apellidos AS autor_apellidos
       FROM forum_threads ft
       JOIN forum_categories fc ON fc.id = ft.category_id
       JOIN users u ON u.id = ft.user_id
       WHERE ft.id = $1 AND ft.is_approved = true`,
      [threadId]
    ),
    pool.query(
      `SELECT fr.*, u.nombre, u.apellidos
       FROM forum_replies fr JOIN users u ON u.id = fr.user_id
       WHERE fr.thread_id = $1 AND fr.is_approved = true
       ORDER BY fr.created_at ASC`,
      [threadId]
    ),
  ]);
  if (!thread.rows[0]) throw makeError('Hilo no encontrado', 404);
  return { ...thread.rows[0], replies: replies.rows };
};

// ── Reviews (público - solo aprobadas) ───────────────────────────────
export const getEmpresaReviews = async (companyId) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.rating, r.comentario, r.created_at,
            u.nombre, u.apellidos
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.company_id = $1 AND r.is_approved = true
     ORDER BY r.created_at DESC`,
    [companyId]
  );
  const avg = rows.length
    ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1)
    : null;
  return { reviews: rows, total: rows.length, promedio: avg ? Number(avg) : null };
};
