import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 12);

  const users: {
    email: string;
    name: string;
    nombre: string;
    role: Role;
    empresaNombre?: string;
  }[] = [
    { email: 'carlos@integrajobs.sv', name: 'Carlos', nombre: 'Carlos', role: Role.SUPERADMIN },
    { email: 'walter@applaudo.sv', name: 'Walter', nombre: 'Walter', role: Role.EMPRESA, empresaNombre: 'Applaudo' },
    { email: 'wilber@gmail.com', name: 'Wilber', nombre: 'Wilber', role: Role.CANDIDATO },
    { email: 'brian@gmail.com', name: 'Brian', nombre: 'Brian', role: Role.CANDIDATO },
  ];

  for (const u of users) {
    await prisma.user.upsert({
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
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
