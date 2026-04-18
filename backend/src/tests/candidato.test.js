// backend/src/tests/candidato.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearCandidato, crearEmpresa, crearVacante } from './helpers.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

describe('GET /api/candidato/perfil', () => {
  test('devuelve perfil del candidato autenticado', async () => {
    const { token, user } = await crearCandidato();
    const res = await request(app)
      .get('/api/candidato/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
    expect(res.body.password_hash).toBeUndefined();
  });

  test('sin token devuelve 401', async () => {
    const res = await request(app).get('/api/candidato/perfil');
    expect(res.status).toBe(401);
  });

  test('empresa no puede acceder al perfil de candidato (403)', async () => {
    const { token } = await crearEmpresa();
    const res = await request(app)
      .get('/api/candidato/perfil')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/candidato/perfil', () => {
  test('actualiza nombre y teléfono del candidato', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .put('/api/candidato/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'NuevoNombre', telefono: '5512345678' });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('NuevoNombre');
    expect(res.body.telefono).toBe('5512345678');
  });
});

describe('POST /api/candidato/postulaciones/:vacancyId', () => {
  test('candidato se postula a una vacante activa y aprobada', async () => {
    const { token, user } = await crearCandidato();
    const { company }    = await crearEmpresa();
    const vacante        = await crearVacante(company.id);

    const res = await request(app)
      .post(`/api/candidato/postulaciones/${vacante.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Estoy interesado' });

    expect(res.status).toBe(201);
    expect(res.body.vacancy_id).toBe(vacante.id);
    expect(res.body.user_id).toBe(user.id);
    expect(res.body.status).toBe('nuevo');
  });

  test('no puede postularse dos veces a la misma vacante (409)', async () => {
    const { token } = await crearCandidato();
    const { company } = await crearEmpresa();
    const vacante = await crearVacante(company.id);

    await request(app)
      .post(`/api/candidato/postulaciones/${vacante.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .post(`/api/candidato/postulaciones/${vacante.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(409);
  });

  test('vacante no encontrada devuelve 404', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .post('/api/candidato/postulaciones/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(404);
  });
});

describe('GET /api/candidato/postulaciones', () => {
  test('devuelve lista de postulaciones del candidato', async () => {
    const { token } = await crearCandidato();
    const { company } = await crearEmpresa();
    const vacante = await crearVacante(company.id);

    await request(app)
      .post(`/api/candidato/postulaciones/${vacante.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .get('/api/candidato/postulaciones')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].vacancy_id).toBe(vacante.id);
  });
});
