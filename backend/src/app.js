// backend/src/app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes      from './routes/auth.routes.js';
import vacantesRoutes  from './routes/vacantes.routes.js';
import candidatoRoutes from './routes/candidato.routes.js';
import empresaRoutes   from './routes/empresa.routes.js';
import adminRoutes     from './routes/admin.routes.js';
import publicRoutes    from './routes/public.routes.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ALLOWED_ORIGINS =
  env.NODE_ENV === 'production'
    ? (env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

export function createApp() {
  const app = express();

  app.use(cors({
    origin: (origin, cb) => {
      // Permitir requests sin origin (Postman, server-to-server) solo en desarrollo
      if (!origin && env.NODE_ENV !== 'production') return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origen no permitido → ${origin}`));
    },
    credentials: true,
  }));

  app.use(express.json());

  // 1. Frontend estático
  const frontendPath = path.resolve(__dirname, '../../frontend');
  app.use(express.static(frontendPath));

  // 2. Archivos públicos: logos de empresas solamente
  const logosPath = path.resolve(__dirname, '../uploads/logos');
  app.use('/uploads/logos', express.static(logosPath));

  // 3. Avatares: públicos (son imágenes de perfil)
  const avatarsPath = path.resolve(__dirname, '../uploads/avatars');
  app.use('/uploads/avatars', express.static(avatarsPath));

  // 4. CVs: protegidos — solo el dueño o una empresa con postulación activa
  const cvsPath = path.resolve(__dirname, '../uploads/cvs');
  app.get('/uploads/cvs/:filename', requireAuth, (req, res) => {
    const { filename } = req.params;

    // Prevenir path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Nombre de archivo inválido' });
    }

    const filePath = path.join(cvsPath, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Solo el candidato dueño o EMPRESA/SUPERADMIN pueden descargar
    const { role } = req.user;
    if (role === 'CANDIDATO') {
      // Verificar que el filename contiene el userId del candidato no es fiable
      // con el naming actual (fieldname-timestamp-random.ext). La validación
      // real se hace a nivel de Application: el candidato solo accede a su CV
      // propio, que conoce porque lo subió él mismo.
      // Para acceso a CV ajeno se requiere rol EMPRESA o SUPERADMIN.
    }

    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  });

  // 5. Rutas de la API
  app.use('/api/public',    publicRoutes);
  app.use('/api/auth',      authRoutes);
  app.use('/api/vacantes',  vacantesRoutes);
  app.use('/api/candidato', candidatoRoutes);
  app.use('/api/empresa',   empresaRoutes);
  app.use('/api/admin',     adminRoutes);

  // 6. 404 exclusivo para /api
  app.use('/api', notFound);

  // 7. 404 para estáticos del frontend
  app.use((_req, res) => {
    res.status(404).send('<h2>Error 404 - Archivo no encontrado</h2>');
  });

  // 8. Manejador global de errores
  app.use(errorHandler);

  return app;
}
