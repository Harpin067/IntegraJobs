// backend/src/tests/empresa.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearEmpresa, crearCandidato, crearVacante, crearPostulacion } from './helpers.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

describe('GET /api/empresa/perfil', () => {
  test('empresa autenticada ve su perfil', async () => {
    const { token, company } = await crearEmpresa();
    const res = await request(app)
      .get('/api/empresa/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe(company.nombre);
    expect(res.body.is_verified).toBe(true);
  });

  test('candidato no puede acceder (403)', async () => {
    const { token } = await crearCandidato();
    const res = await request(app)
      .get('/api/empresa/perfil')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/empresa/perfil', () => {
  test('empresa actualiza su descripción y sitio web', async () => {
    const { token } = await crearEmpresa();
    const res = await request(app)
      .put('/api/empresa/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ descripcion: 'Nueva descripción', sitioWeb: 'https://testco.com' });

    expect(res.status).toBe(200);
    expect(res.body.descripcion).toBe('Nueva descripción');
    expect(res.body.sitio_web).toBe('https://testco.com');
  });
});

describe('GET /api/empresa/vacantes', () => {
  test('devuelve solo las vacantes de la empresa autenticada', async () => {
    const { token, company } = await crearEmpresa();
    const { company: otraEmpresa } = await crearEmpresa({ email: 'otra@empresa.com', empresaNombre: 'Otra Co' });

    await crearVacante(company.id, { titulo: 'Mi vacante' });
    await crearVacante(otraEmpresa.id, { titulo: 'Vacante de otra empresa' });

    const res = await request(app)
      .get('/api/empresa/vacantes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].titulo).toBe('Mi vacante');
  });
});

describe('GET /api/empresa/vacantes/:id/aplicaciones', () => {
  test('empresa ve aplicaciones a su vacante', async () => {
    const { token, company } = await crearEmpresa();
    const { user: candidato } = await crearCandidato();
    const vacante = await crearVacante(company.id);
    await crearPostulacion(vacante.id, candidato.id);

    const res = await request(app)
      .get(`/api/empresa/vacantes/${vacante.id}/aplicaciones`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].user_id).toBe(candidato.id);
  });
});

describe('PATCH /api/empresa/aplicaciones/:id/status', () => {
  test('empresa cambia status de una aplicación', async () => {
    const { token, company } = await crearEmpresa();
    const { user: candidato } = await crearCandidato();
    const vacante = await crearVacante(company.id);
    const aplicacion = await crearPostulacion(vacante.id, candidato.id);

    const res = await request(app)
      .patch(`/api/empresa/aplicaciones/${aplicacion.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'en_proceso' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('en_proceso');
  });
});
