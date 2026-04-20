import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/db.js';
import { env } from '../config/env.js';

const makeToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, nombre: user.nombre ?? user.name, email: user.email,
      companyId: user.company_id ?? user.companyId ?? null },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );

const makeError = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

export const login = async ({ email, password, attemptedRole }) => {
  const { rows } = await pool.query(
    `SELECT u.*, c.is_verified AS company_verified, c.id AS company_id
     FROM users u
     LEFT JOIN companies c ON c.user_id = u.id
     WHERE u.email = $1`,
    [email]
  );
  const user = rows[0];

  if (!user || !user.password_hash) throw makeError('Credenciales incorrectas', 401);
  if (!user.is_active) throw makeError('Tu cuenta ha sido desactivada. Contacta a soporte.', 403);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw makeError('Credenciales incorrectas', 401);

  // SUPERADMIN bypasa la validación de rol — entra sin importar la pestaña seleccionada
  const isSuperAdmin = user.role === 'SUPERADMIN';

  if (!isSuperAdmin) {
    if (user.role === 'CANDIDATO' && attemptedRole !== 'CANDIDATO')
      throw makeError('Esta cuenta pertenece a un candidato. Selecciona la pestaña correcta.', 401);

    if (user.role === 'EMPRESA' && attemptedRole !== 'EMPRESA')
      throw makeError('Esta cuenta pertenece a una empresa. Selecciona la pestaña correcta.', 401);
  }

  if (user.role === 'EMPRESA') {
    if (!user.company_id)
      throw makeError('Tu perfil de empresa no ha sido completado.', 403);
    if (!user.company_verified)
      throw makeError('Tu empresa está pendiente de verificación por el administrador.', 403);
  }

  const token = makeToken(user);
  return {
    token,
    user: {
      id:        user.id,
      email:     user.email,
      role:      user.role,
      nombre:    user.nombre ?? user.name,
      companyId: user.company_id ?? null,
    },
  };
};

export const registrarCandidato = async ({ email, password, nombre, apellidos }) => {
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) throw makeError('El email ya está registrado', 409);

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, nombre, apellidos)
     VALUES ($1, $2, 'CANDIDATO', $3, $4) RETURNING *`,
    [email, hash, nombre, apellidos]
  );
  const user = rows[0];
  return {
    token: makeToken(user),
    user: { id: user.id, email: user.email, role: user.role, nombre: user.nombre },
  };
};

export const registrarEmpresa = async ({ email, password, nombre, empresaNombre, descripcion, ubicacion, industria }) => {
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) throw makeError('El email ya está registrado', 409);

  const hash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: userRows } = await client.query(
      `INSERT INTO users (email, password_hash, role, nombre, empresa_nombre)
       VALUES ($1, $2, 'EMPRESA', $3, $4) RETURNING *`,
      [email, hash, nombre, empresaNombre]
    );
    const user = userRows[0];
    await client.query(
      `INSERT INTO companies (user_id, nombre, descripcion, ubicacion, industria)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, empresaNombre, descripcion, ubicacion, industria]
    );
    await client.query('COMMIT');
    return { message: 'Empresa registrada. Espera verificación del administrador.' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
