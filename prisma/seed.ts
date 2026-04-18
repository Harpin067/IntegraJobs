import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const hash = await bcrypt.hash('Password123!', 12);

  const users: {
    email: string;
    name: string;
    nombre: string;
    role: Role;
    empresaNombre?: string;
  }[] = [
    {
      email: 'carlos@integrajobs.sv',
      name: 'Carlos',
      nombre: 'Carlos',
      role: 'SUPERADMIN' as Role,
    },
    {
      email: 'walter@applaudo.sv',
      name: 'Walter',
      nombre: 'Walter',
      role: 'EMPRESA' as Role,
      empresaNombre: 'Applaudo',
    },
    {
      email: 'wilber@gmail.com',
      name: 'Wilber',
      nombre: 'Wilber',
      role: 'CANDIDATO' as Role,
    },
    {
      email: 'brian@gmail.com',
      name: 'Brian',
      nombre: 'Brian',
      role: 'CANDIDATO' as Role,
    },
  ];

  for (const u of users) {
    await (prisma as any).user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        nombre: u.nombre,
        passwordHash: hash,
        role: u.role,
        empresaNombre: u.empresaNombre ?? null,
      },
    });
    console.log(`✓  ${u.role.padEnd(12)} → ${u.email}`);
  }

  console.log('\n✅ Seed completado — 4 usuarios creados en IntegraJobs El Salvador.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await (prisma as any).$disconnect();
  });
