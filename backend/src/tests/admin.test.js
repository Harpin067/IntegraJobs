// backend/src/tests/admin.test.js
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearCandidato, crearEmpresa, crearVacante } from './helpers.js';
import { env } from '../config/env.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

const adminToken = () =>
  jwt.sign(
    { id: '00000000-0000-0000-0000-000000000001', role: 'SUPERADMIN', nombre: 'Admin', email: 'admin@portal.com' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

describe('GET /api/admin/usuarios', () => {
  test('superadmin lista todos los usuarios', async () => {
    await crearCandidato();
    await crearEmpresa();

    const res = await request(app)
      .get('/api/admin/usuarios')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0].password_hash).toBeUndefined();
  });

  test('candidato no puede acceder (403)', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .get('/api/admin/usuarios')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/admin/usuarios/:id/toggle', () => {
  test('superadmin desactiva un usuario', async () => {
    const { user } = await crearCandidato();

    const res = await request(app)
      .patch(`/api/admin/usuarios/${user.id}/toggle`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(false);
  });
});

describe('GET /api/admin/empresas/pendientes', () => {
  test('lista empresas sin verificar', async () => {
    await crearEmpresa({ isVerified: false });

    const res = await request(app)
      .get('/api/admin/empresas/pendientes')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].is_verified).toBe(false);
  });
});

describe('PATCH /api/admin/empresas/:id/verificar', () => {
  test('superadmin verifica una empresa', async () => {
    const { company } = await crearEmpresa({ isVerified: false });

    const res = await request(app)
      .patch(`/api/admin/empresas/${company.id}/verificar`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ verificar: true });

    expect(res.status).toBe(200);
    expect(res.body.is_verified).toBe(true);
  });
});

describe('GET /api/admin/vacantes/pendientes', () => {
  test('lista vacantes no aprobadas', async () => {
    const { company } = await crearEmpresa();
    await crearVacante(company.id, { isApproved: false });

    const res = await request(app)
      .get('/api/admin/vacantes/pendientes')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].is_approved).toBe(false);
  });
});

describe('PATCH /api/admin/vacantes/:id/aprobar', () => {
  test('superadmin aprueba una vacante', async () => {
    const { company } = await crearEmpresa();
    const vacante = await crearVacante(company.id, { isApproved: false });

    const res = await request(app)
      .patch(`/api/admin/vacantes/${vacante.id}/aprobar`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ aprobar: true });

    expect(res.status).toBe(200);
    expect(res.body.is_approved).toBe(true);
  });
});
