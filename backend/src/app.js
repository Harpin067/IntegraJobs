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

// Replicando __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // 1. Frontend estático (Resolución absoluta y segura)
  // __dirname es backend/src, subimos dos niveles para llegar a la raíz y luego entramos a frontend
  const frontendPath = path.resolve(__dirname, '../../frontend');
  app.use(express.static(frontendPath));

  // 2. Archivos subidos (Logos y CVs)
  // Subimos un nivel desde src para llegar a backend/uploads
  const uploadsPath = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  // 3. Rutas de la API
  app.use('/api/public',    publicRoutes);
  app.use('/api/auth',      authRoutes);
  app.use('/api/vacantes',  vacantesRoutes);
  app.use('/api/candidato', candidatoRoutes);
  app.use('/api/empresa',   empresaRoutes);
  app.use('/api/admin',     adminRoutes);

  // 4. Manejo de error 404 EXCLUSIVO para la API
  app.use('/api', notFound);

  // 5. Manejo de error 404 para vistas del Frontend
  // Si alguien pide un JS o HTML que no existe, devolvemos un mensaje claro en lugar de romper el MIME type
  app.use((req, res, next) => {
    res.status(404).send('<h2>Error 404 - Archivo no encontrado</h2><p>La ruta estática solicitada no existe en el servidor.</p>');
  });

  // 6. Manejador global de errores (para la base de datos, validaciones, etc.)
  app.use(errorHandler);

  return app;
}