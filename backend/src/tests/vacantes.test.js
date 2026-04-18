// backend/src/tests/vacantes.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearEmpresa, crearVacante, crearCandidato } from './helpers.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

describe('GET /api/vacantes', () => {
  test('devuelve lista vacía cuando no hay vacantes activas y aprobadas', async () => {
    const res = await request(app).get('/api/vacantes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('devuelve vacantes activas y aprobadas', async () => {
    const { company } = await crearEmpresa();
    await crearVacante(company.id, { status: 'activa', isApproved: true });
    await crearVacante(company.id, { status: 'pausada', isApproved: true });
    await crearVacante(company.id, { status: 'activa', isApproved: false });

    const res = await request(app).get('/api/vacantes');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].titulo).toBe('Desarrollador JS');
  });

  test('filtra por tipo_trabajo', async () => {
    const { company } = await crearEmpresa();
    await crearVacante(company.id, { tipoTrabajo: 'remoto' });
    await crearVacante(company.id, { tipoTrabajo: 'presencial', titulo: 'Dev Presencial' });

    const res = await request(app).get('/api/vacantes?tipo_trabajo=remoto');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].tipo_trabajo).toBe('remoto');
  });
});

describe('GET /api/vacantes/:id', () => {
  test('devuelve detalle de vacante existente', async () => {
    const { company } = await crearEmpresa();
    const vacante = await crearVacante(company.id);

    const res = await request(app).get(`/api/vacantes/${vacante.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(vacante.id);
    expect(res.body.titulo).toBe(vacante.titulo);
    expect(res.body.empresa).toBeDefined();
  });

  test('devuelve 404 si la vacante no existe', async () => {
    const res = await request(app).get('/api/vacantes/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/vacantes', () => {
  test('empresa autenticada crea vacante', async () => {
    const { token } = await crearEmpresa();
    const res = await request(app)
      .post('/api/vacantes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Backend Node.js', descripcion: 'Descripción', requisitos: 'Requisitos',
        ubicacion: 'Remoto', tipoTrabajo: 'remoto', tipoContrato: 'completo',
        experiencia: 'mid', contacto: 'hr@company.com',
      });
    expect(res.status).toBe(201);
    expect(res.body.titulo).toBe('Backend Node.js');
    expect(res.body.is_approved).toBe(false);
  });

  test('sin token devuelve 401', async () => {
    const res = await request(app).post('/api/vacantes').send({ titulo: 'Test' });
    expect(res.status).toBe(401);
  });

  test('candidato no puede crear vacante (403)', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .post('/api/vacantes')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Test' });
    expect(res.status).toBe(403);
  });
});
