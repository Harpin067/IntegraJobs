// backend/src/tests/setup.js
import { pool } from '../db/db.js';

export const cleanUsers = async () => {
  await pool.query('DELETE FROM applications');
  await pool.query('DELETE FROM vacancies');
  await pool.query('DELETE FROM companies');
  await pool.query('DELETE FROM users WHERE role != $1', ['SUPERADMIN']);
};

export const closePool = async () => pool.end();
