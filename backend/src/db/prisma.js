import { PrismaClient } from '@prisma/client';

// Singleton — evita múltiples instancias en dev con `node --watch`
export const prisma = globalThis.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma;
