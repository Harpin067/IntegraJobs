import {
  PrismaClient,
  Role,
  TipoTrabajo,
  TipoContrato,
  Experiencia,
  VacancyStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 12);

  // ─── 1. Usuarios ────────────────────────────────────────────────
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

  // ─── 2. Company de Walter ───────────────────────────────────────
  const walter = await prisma.user.findUniqueOrThrow({
    where: { email: 'walter@applaudo.sv' },
  });

  const company = await prisma.company.upsert({
    where: { userId: walter.id },
    update: {},
    create: {
      userId: walter.id,
      nombre: 'Applaudo Studios',
      descripcion:
        'Consultora salvadoreña de desarrollo de software nearshore con presencia regional en Centroamérica.',
      sitioWeb: 'https://applaudostudios.com',
      ubicacion: 'San Salvador, El Salvador',
      industria: 'Tecnología / Desarrollo de software',
      isVerified: true,
    },
  });
  console.log(`✓  COMPANY      → ${company.nombre}`);

  // ─── 3. Vacantes de prueba ──────────────────────────────────────
  const vacancies = [
    {
      titulo: 'Desarrollador Full-Stack (React + Node.js)',
      descripcion:
        'Buscamos un desarrollador para construir interfaces modernas con React y APIs REST en Node.js/Express.',
      requisitos:
        '2+ años con React, experiencia con Node.js/Express, manejo de PostgreSQL, Git, inglés intermedio.',
      ubicacion: 'San Salvador (remoto)',
      tipoTrabajo: TipoTrabajo.remoto,
      tipoContrato: TipoContrato.completo,
      salarioMin: 1200,
      salarioMax: 1800,
      experiencia: Experiencia.mid,
      contacto: 'talento@applaudostudios.com',
      status: VacancyStatus.activa,
      isApproved: true,
    },
    {
      titulo: 'QA Engineer Semi-Senior',
      descripcion:
        'Responsable de diseñar y ejecutar pruebas automatizadas y manuales para productos web de alto tráfico.',
      requisitos:
        'Experiencia con Cypress o Playwright, conocimiento de APIs REST, nociones de CI/CD, inglés conversacional.',
      ubicacion: 'Santa Tecla, La Libertad',
      tipoTrabajo: TipoTrabajo.hibrido,
      tipoContrato: TipoContrato.completo,
      salarioMin: 1000,
      salarioMax: 1500,
      experiencia: Experiencia.mid,
      contacto: 'talento@applaudostudios.com',
      status: VacancyStatus.activa,
      isApproved: true,
    },
  ];

  for (const v of vacancies) {
    const existing = await prisma.vacancy.findFirst({
      where: { companyId: company.id, titulo: v.titulo },
    });
    if (existing) {
      console.log(`↻  VACANCY     → ${v.titulo} (ya existía)`);
      continue;
    }
    await prisma.vacancy.create({
      data: { ...v, companyId: company.id },
    });
    console.log(`✓  VACANCY     → ${v.titulo}`);
  }

  console.log('\n✅ Seed completado — 4 usuarios, 1 empresa y 2 vacantes cargados.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
