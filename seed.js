// seed.js — ES Module
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const hash = await bcrypt.hash('Admin1234!', 12);
  await pool.query(`
    INSERT INTO users (email, password_hash, role, nombre, apellidos)
    VALUES ($1, $2, 'SUPERADMIN', $3, $4)
    ON CONFLICT (email) DO NOTHING
  `, ['admin@portal.com', hash, 'Super', 'Admin']);

  console.log('Seed completado. Admin: admin@portal.com / Admin1234!');
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
