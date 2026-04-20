// backend/src/app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes      from './routes/auth.routes.js';
import vacantesRoutes  from './routes/vacantes.routes.js';
import candidatoRoutes from './routes/candidato.routes.js';
import empresaRoutes   from './routes/empresa.routes.js';
import adminRoutes     from './routes/admin.routes.js';
import publicRoutes    from './routes/public.routes.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Frontend estático (Plan 3)
  app.use(express.static(path.join(__dirname, '../../frontend')));

  app.use('/api/public',    publicRoutes);
  app.use('/api/auth',      authRoutes);
  app.use('/api/vacantes',  vacantesRoutes);
  app.use('/api/candidato', candidatoRoutes);
  app.use('/api/empresa',   empresaRoutes);
  app.use('/api/admin',     adminRoutes);

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
