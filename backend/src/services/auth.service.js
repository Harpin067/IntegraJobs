import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { httpError } from '../middlewares/error.middleware.js';

const signToken = (user, companyId = null) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      nombre: user.nombre ?? user.name ?? null,
      companyId,
    },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );

const publicUser = (user, companyId = null) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  nombre: user.nombre ?? user.name ?? null,
  companyId,
});

// ─── LOGIN ──────────────────────────────────────────────────────────
export const login = async ({ email, password, loginType }) => {
  const attempted = String(loginType || '').toUpperCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user || !user.passwordHash) throw httpError('Credenciales incorrectas', 401);
  if (!user.isActive) throw httpError('Tu cuenta ha sido desactivada. Contacta a soporte.', 403);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw httpError('Credenciales incorrectas', 401);

  // SUPERADMIN ignora el tipo de pestaña
  if (user.role !== 'SUPERADMIN') {
    if (user.role === 'CANDIDATO' && attempted !== 'CANDIDATO')
      throw httpError('Esta cuenta pertenece a un candidato. Selecciona la pestaña correcta.', 401);
    if (user.role === 'EMPRESA' && attempted !== 'EMPRESA')
      throw httpError('Esta cuenta pertenece a una empresa. Selecciona la pestaña correcta.', 401);
  }

  if (user.role === 'EMPRESA') {
    if (!user.company) throw httpError('Tu perfil de empresa no ha sido completado.', 403);
    if (!user.company.isVerified)
      throw httpError('Tu empresa está pendiente de verificación por el administrador.', 403);
  }

  const companyId = user.company?.id ?? null;
  return { token: signToken(user, companyId), user: publicUser(user, companyId) };
};

// ─── REGISTRO CANDIDATO ─────────────────────────────────────────────
export const registrarCandidato = async ({ email, password, nombre, apellidos }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw httpError('El email ya está registrado', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: 'CANDIDATO', nombre, apellidos },
  });

  return { token: signToken(user), user: publicUser(user) };
};

// ─── REGISTRO EMPRESA (transacción) ─────────────────────────────────
export const registrarEmpresa = async ({
  email, password, nombre, empresaNombre,
  descripcion = '', ubicacion, industria, sitioWeb = null,
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw httpError('El email ya está registrado', 409);

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'EMPRESA',
        nombre,
      },
    });
    await tx.company.create({
      data: {
        userId: user.id,
        nombre: empresaNombre,
        descripcion,
        ubicacion,
        industria,
        sitioWeb,
      },
    });
  });

  return { message: 'Empresa registrada. Espera verificación del administrador.' };
};
