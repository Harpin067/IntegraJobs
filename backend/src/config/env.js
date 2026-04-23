import 'dotenv/config';

export const env = {
  DATABASE_URL:     process.env.DATABASE_URL,
  JWT_SECRET:       process.env.JWT_SECRET,
  PORT:             parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV:         process.env.NODE_ENV ?? 'development',
  ALLOWED_ORIGINS:  process.env.ALLOWED_ORIGINS ?? '',
};

if (!env.DATABASE_URL) throw new Error('DATABASE_URL no definida en .env');
if (!env.JWT_SECRET)   throw new Error('JWT_SECRET no definida en .env');
