// backend/src/tests/auth.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';

const app = createApp();

beforeEach(cleanUsers);
afterAll(closePool);

// ── Registro candidato ──────────────────────────────────────────────
describe('POST /api/auth/registro/candidato', () => {
  test('registra un candidato nuevo y devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/registro/candidato')
      .send({ email: 'test@candidato.com', password: 'Password1!', nombre: 'Ana', apellidos: 'López' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('CANDIDATO');
  });

  test('rechaza email duplicado con 409', async () => {
    const payload = { email: 'dup@candidato.com', password: 'Password1!', nombre: 'X', apellidos: 'Y' };
    await request(app).post('/api/auth/registro/candidato').send(payload);
    const res = await request(app).post('/api/auth/registro/candidato').send(payload);
    expect(res.status).toBe(409);
  });

  test('rechaza password corta con 422', async () => {
    const res = await request(app)
      .post('/api/auth/registro/candidato')
      .send({ email: 'short@test.com', password: '123', nombre: 'X', apellidos: 'Y' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ── Registro empresa ────────────────────────────────────────────────
describe('POST /api/auth/registro/empresa', () => {
  test('registra empresa sin token (pendiente verificación)', async () => {
    const res = await request(app)
      .post('/api/auth/registro/empresa')
      .send({
        email: 'test@empresa.com', password: 'Password1!',
        nombre: 'Admin Empresa', empresaNombre: 'TechCo',
        descripcion: 'Empresa de tech', ubicacion: 'CDMX', industria: 'Software',
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/verificación/i);
    expect(res.body.token).toBeUndefined();
  });
});

// ── Login ───────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  test('candidato hace login correctamente', async () => {
    await request(app).post('/api/auth/registro/candidato')
      .send({ email: 'login@test.com', password: 'Password1!', nombre: 'Test', apellidos: 'User' });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password1!', loginType: 'candidato' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('CANDIDATO');
  });

  test('rechaza password incorrecta con 401', async () => {
    await request(app).post('/api/auth/registro/candidato')
      .send({ email: 'wrong@test.com', password: 'Password1!', nombre: 'Test', apellidos: 'User' });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrongpass', loginType: 'candidato' });

    expect(res.status).toBe(401);
  });

  test('candidato no puede entrar con loginType empresa', async () => {
    await request(app).post('/api/auth/registro/candidato')
      .send({ email: 'rbac@test.com', password: 'Password1!', nombre: 'Test', apellidos: 'User' });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'rbac@test.com', password: 'Password1!', loginType: 'empresa' });

    expect(res.status).toBe(403);
  });

  test('empresa no verificada no puede hacer login', async () => {
    await request(app).post('/api/auth/registro/empresa')
      .send({
        email: 'noverif@empresa.com', password: 'Password1!',
        nombre: 'Admin', empresaNombre: 'Corp',
        descripcion: 'Desc', ubicacion: 'MTY', industria: 'Tech',
      });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'noverif@empresa.com', password: 'Password1!', loginType: 'empresa' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/verificación/i);
  });

  test('endpoint con body vacío devuelve 422', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });
});
