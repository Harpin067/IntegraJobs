import './backend/src/config/env.js';
const { postular } = await import('./backend/src/services/candidato.service.js');
const { pool } = await import('./backend/src/db/db.js');

try {
  const { rows: users } = await pool.query("SELECT id FROM users WHERE role = 'CANDIDATO' LIMIT 1");
  const userId = users[0].id;
  console.log('userId:', userId);
  const result = await postular(userId, 'f65cdef8-0a16-417c-9522-ded112ea232c', 'test message');
  console.log('SUCCESS:', JSON.stringify(result));
  await pool.end();
} catch(e) {
  console.error('ERROR:', e.message);
  console.error('CODE:', e.code);
  console.error('DETAIL:', e.detail);
  await pool.end();
  process.exit(1);
}
