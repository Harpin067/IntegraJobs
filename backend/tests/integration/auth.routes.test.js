import { jest } from '@jest/globals';

// Mockeamos el SERVICE (evitamos Prisma y bcrypt en este nivel).
const serviceMock = {
  login: jest.fn(),
  registrarCandidato: jest.fn(),
  registrarEmpresa: jest.fn(),
};
jest.unstable_mockModule('../../src/services/auth.service.js', () => serviceMock);

const request = (await import('supertest')).default;
const { createApp } = await import('../../src/app.js');
const app = createApp();

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/login', () => {
  it('200 con credenciales válidas', async () => {
    serviceMock.login.mockResolvedValue({
      token: 'fake.jwt.token',
      user: { id: 'u1', email: 'c@d.sv', role: 'CANDIDATO', nombre: 'Carlos' },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'c@d.sv', password: 'Password123!', loginType: 'candidato',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('fake.jwt.token');
    expect(serviceMock.login).toHaveBeenCalledWith(expect.objectContaining({ email: 'c@d.sv' }));
  });

  it('422 si falta password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'c@d.sv', loginType: 'candidato',
    });
    expect(res.status).toBe(422);
    expect(serviceMock.login).not.toHaveBeenCalled();
  });

  it('422 si loginType es inválido', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'c@d.sv', password: 'Password123!', loginType: 'hacker',
    });
    expect(res.status).toBe(422);
  });

  it('propaga 401 del service como JSON uniforme', async () => {
    const err = new Error('Credenciales incorrectas');
    err.statusCode = 401;
    serviceMock.login.mockRejectedValue(err);

    const res = await request(app).post('/api/auth/login').send({
      email: 'c@d.sv', password: 'mala', loginType: 'candidato',
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Credenciales incorrectas' });
  });

  it('oculta mensaje en 500', async () => {
    serviceMock.login.mockRejectedValue(new Error('fuga interna'));
    const res = await request(app).post('/api/auth/login').send({
      email: 'c@d.sv', password: 'Password123!', loginType: 'candidato',
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });
});

describe('POST /api/auth/registro/candidato', () => {
  it('201 al registrar', async () => {
    serviceMock.registrarCandidato.mockResolvedValue({
      token: 't', user: { id: 'u', email: 'n@d.sv', role: 'CANDIDATO' },
    });
    const res = await request(app).post('/api/auth/registro/candidato').send({
      email: 'n@d.sv', password: 'Password123!', nombre: 'Nuevo', apellidos: 'Perez',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('CANDIDATO');
  });

  it('422 si password < 8 caracteres', async () => {
    const res = await request(app).post('/api/auth/registro/candidato').send({
      email: 'n@d.sv', password: '123', nombre: 'N', apellidos: 'P',
    });
    expect(res.status).toBe(422);
  });

  it('409 si el service reporta email duplicado', async () => {
    const err = new Error('El email ya está registrado');
    err.statusCode = 409;
    serviceMock.registrarCandidato.mockRejectedValue(err);
    const res = await request(app).post('/api/auth/registro/candidato').send({
      email: 'dup@d.sv', password: 'Password123!', nombre: 'N', apellidos: 'P',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/registro/empresa', () => {
  it('201 al registrar empresa', async () => {
    serviceMock.registrarEmpresa.mockResolvedValue({ message: 'Empresa registrada. Espera verificación.' });
    const res = await request(app).post('/api/auth/registro/empresa').send({
      email: 'w@a.sv', password: 'Password123!', nombre: 'Walter',
      empresaNombre: 'Applaudo', ubicacion: 'SS', industria: 'Tech',
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registrada/i);
  });

  it('422 si faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/registro/empresa').send({
      email: 'w@a.sv', password: 'Password123!',
    });
    expect(res.status).toBe(422);
  });
});

describe('404 /api/*', () => {
  it('responde JSON uniforme en ruta inexistente', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Ruta no encontrada' });
  });
});
