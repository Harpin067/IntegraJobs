// backend/src/tests/public.test.js
import request from 'supertest';
import { createApp } from '../app.js';
import { cleanUsers, closePool } from './setup.js';
import { crearEmpresa, crearVacante } from './helpers.js';

const app = createApp();
beforeEach(cleanUsers);
afterAll(closePool);

describe('GET /api/public/stats', () => {
  test('devuelve estructura correcta con BD vacía', async () => {
    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalVacantes: 0,
      totalEmpresas: 0,
      vacantesRecientes: [],
      topIndustrias: [],
    });
  });

  test('totalVacantes solo cuenta activas y aprobadas', async () => {
    const { company } = await crearEmpresa();
    await crearVacante(company.id, { status: 'activa', isApproved: true });
    await crearVacante(company.id, { status: 'pausada', isApproved: true });
    await crearVacante(company.id, { status: 'activa', isApproved: false });

    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalVacantes).toBe(1);
  });

  test('vacantesRecientes incluye datos de empresa', async () => {
    const { company } = await crearEmpresa({ industria: 'Tecnología' });
    await crearVacante(company.id, { titulo: 'Dev Backend', status: 'activa', isApproved: true });

    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    expect(res.body.vacantesRecientes).toHaveLength(1);
    const v = res.body.vacantesRecientes[0];
    expect(v.titulo).toBe('Dev Backend');
    expect(v.empresa_nombre).toBeDefined();
  });

  test('topIndustrias devuelve máximo 4 industrias ordenadas por frecuencia', async () => {
    await crearEmpresa({ industria: 'Tech' });
    await crearEmpresa({ industria: 'Tech' });
    await crearEmpresa({ industria: 'Salud' });
    await crearEmpresa({ industria: 'Educación' });
    await crearEmpresa({ industria: 'Finanzas' });
    await crearEmpresa({ industria: 'Retail' });

    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    expect(res.body.topIndustrias.length).toBeLessThanOrEqual(4);
    expect(res.body.topIndustrias[0].industria).toBe('Tech');
    expect(res.body.topIndustrias[0].total).toBe(2);
  });

  test('no requiere autenticación', async () => {
    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
  });
});
