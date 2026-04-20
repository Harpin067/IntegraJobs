import { jest } from '@jest/globals';

// ─── Mock de Prisma (ESM) ─────────────────────────────────────────────
const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  company: { create: jest.fn() },
  $transaction: jest.fn(async (fn) => fn(prismaMock)),
};

jest.unstable_mockModule('../../src/db/prisma.js', () => ({
  prisma: prismaMock,
}));

// Import dinámico DESPUÉS del mock
const bcrypt = (await import('bcryptjs')).default;
const jwt    = (await import('jsonwebtoken')).default;
const authService = await import('../../src/services/auth.service.js');

// ─── Helpers ──────────────────────────────────────────────────────────
const baseUser = {
  id: 'uuid-user',
  email: 'test@demo.sv',
  passwordHash: '',
  role: 'CANDIDATO',
  nombre: 'Test',
  isActive: true,
  company: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── LOGIN ────────────────────────────────────────────────────────────
describe('authService.login', () => {
  it('devuelve token válido con credenciales correctas (CANDIDATO)', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 4);
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    const result = await authService.login({
      email: 'test@demo.sv', password: 'Password123!', loginType: 'candidato',
    });

    expect(result.token).toEqual(expect.any(String));
    const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ id: 'uuid-user', role: 'CANDIDATO' });
    expect(result.user).toMatchObject({ email: 'test@demo.sv', role: 'CANDIDATO' });
  });

  it('lanza 401 si el usuario no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(authService.login({ email: 'x@x.sv', password: 'y', loginType: 'candidato' }))
      .rejects.toMatchObject({ statusCode: 401, message: 'Credenciales incorrectas' });
  });

  it('lanza 401 si la contraseña no coincide', async () => {
    const passwordHash = await bcrypt.hash('otra', 4);
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
    await expect(authService.login({ email: 'test@demo.sv', password: 'mala', loginType: 'candidato' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('lanza 403 si la cuenta está desactivada', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 4);
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash, isActive: false });
    await expect(authService.login({ email: 'test@demo.sv', password: 'Password123!', loginType: 'candidato' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('lanza 401 si CANDIDATO intenta entrar como EMPRESA', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 4);
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
    await expect(authService.login({ email: 'test@demo.sv', password: 'Password123!', loginType: 'empresa' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('lanza 403 si EMPRESA no está verificada', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash,
      role: 'EMPRESA',
      company: { id: 'c1', isVerified: false },
    });
    await expect(authService.login({ email: 'test@demo.sv', password: 'Password123!', loginType: 'empresa' }))
      .rejects.toMatchObject({ statusCode: 403, message: expect.stringContaining('pendiente') });
  });

  it('SUPERADMIN ingresa sin importar loginType', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 4);
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash, role: 'SUPERADMIN' });
    const result = await authService.login({
      email: 'test@demo.sv', password: 'Password123!', loginType: 'candidato',
    });
    expect(result.token).toEqual(expect.any(String));
  });
});

// ─── REGISTRO CANDIDATO ───────────────────────────────────────────────
describe('authService.registrarCandidato', () => {
  it('crea candidato y devuelve token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'new-uuid', email: 'nuevo@demo.sv', role: 'CANDIDATO', nombre: 'Nuevo',
    });

    const result = await authService.registrarCandidato({
      email: 'nuevo@demo.sv', password: 'Password123!', nombre: 'Nuevo', apellidos: 'Perez',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'CANDIDATO', email: 'nuevo@demo.sv' }) })
    );
    expect(result.token).toEqual(expect.any(String));
    expect(result.user).toMatchObject({ role: 'CANDIDATO' });
  });

  it('lanza 409 si el email ya existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existe' });
    await expect(authService.registrarCandidato({
      email: 'existe@demo.sv', password: 'Password123!', nombre: 'X', apellidos: 'Y',
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

// ─── REGISTRO EMPRESA ─────────────────────────────────────────────────
describe('authService.registrarEmpresa', () => {
  it('crea user y company en transacción', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'e@e.sv', role: 'EMPRESA' });
    prismaMock.company.create.mockResolvedValue({ id: 'c1' });

    const res = await authService.registrarEmpresa({
      email: 'e@e.sv', password: 'Password123!', nombre: 'Walter',
      empresaNombre: 'Applaudo', ubicacion: 'SS', industria: 'Tech',
    });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(prismaMock.company.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nombre: 'Applaudo' }) })
    );
    expect(res.message).toMatch(/verificación/i);
  });

  it('lanza 409 si el email ya existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'dup' });
    await expect(authService.registrarEmpresa({
      email: 'dup@e.sv', password: 'Password123!', nombre: 'W',
      empresaNombre: 'X', ubicacion: 'SS', industria: 'Tech',
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
