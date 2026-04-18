// backend/src/tests/helpers.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/db.js';
import { env } from '../config/env.js';

const makeToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, nombre: user.nombre, email: user.email, companyId: user.companyId ?? null },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );

export const crearCandidato = async (overrides = {}) => {
  const email = overrides.email ?? `candidato_${Date.now()}@test.com`;
  const hash  = await bcrypt.hash('Password1!', 4);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, nombre, apellidos, cv_url)
     VALUES ($1, $2, 'CANDIDATO', $3, $4, $5) RETURNING *`,
    [email, hash, overrides.nombre ?? 'Test', overrides.apellidos ?? 'Candidato', overrides.cvUrl ?? 'https://example.com/cv.pdf']
  );
  const user = rows[0];
  return { user, token: makeToken({ ...user, companyId: null }) };
};

export const crearEmpresa = async (overrides = {}) => {
  const email = overrides.email ?? `empresa_${Date.now()}@test.com`;
  const hash  = await bcrypt.hash('Password1!', 4);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: uRows } = await client.query(
      `INSERT INTO users (email, password_hash, role, nombre, empresa_nombre)
       VALUES ($1, $2, 'EMPRESA', $3, $4) RETURNING *`,
      [email, hash, overrides.nombre ?? 'Admin Empresa', overrides.empresaNombre ?? 'TestCo']
    );
    const user = uRows[0];
    const { rows: cRows } = await client.query(
      `INSERT INTO companies (user_id, nombre, descripcion, ubicacion, industria, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.id, overrides.empresaNombre ?? 'TestCo', overrides.descripcion ?? 'Empresa de prueba',
       overrides.ubicacion ?? 'CDMX', overrides.industria ?? 'Tech', overrides.isVerified ?? true]
    );
    await client.query('COMMIT');
    const company = cRows[0];
    const token = makeToken({ ...user, companyId: company.id });
    return { user, company, token };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const crearVacante = async (companyId, overrides = {}) => {
  const { rows } = await pool.query(
    `INSERT INTO vacancies
       (company_id, titulo, descripcion, requisitos, ubicacion,
        tipo_trabajo, tipo_contrato, experiencia, contacto, status, is_approved)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      companyId,
      overrides.titulo        ?? 'Desarrollador JS',
      overrides.descripcion   ?? 'Descripción de prueba',
      overrides.requisitos    ?? 'Requisitos de prueba',
      overrides.ubicacion     ?? 'CDMX',
      overrides.tipoTrabajo   ?? 'remoto',
      overrides.tipoContrato  ?? 'completo',
      overrides.experiencia   ?? 'mid',
      overrides.contacto      ?? 'reclutamiento@testco.com',
      overrides.status        ?? 'activa',
      overrides.isApproved    ?? true,
    ]
  );
  return rows[0];
};

export const crearPostulacion = async (vacancyId, userId, overrides = {}) => {
  const { rows } = await pool.query(
    `INSERT INTO applications (vacancy_id, user_id, cv_snapshot, mensaje, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [vacancyId, userId,
     overrides.cvSnapshot ?? 'https://example.com/cv.pdf',
     overrides.mensaje    ?? null,
     overrides.status     ?? 'nuevo']
  );
  return rows[0];
};
