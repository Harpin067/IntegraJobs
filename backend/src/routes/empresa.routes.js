// backend/src/routes/empresa.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/empresa.controller.js';

const router = Router();

const APP_STATUSES = ['nuevo', 'en_proceso', 'rechazado', 'contratado'];

router.use(requireAuth, requireRole('EMPRESA'));

router.get('/perfil', ctrl.getPerfil);

router.put('/perfil',
  body('nombre').optional().notEmpty().trim(),
  body('descripcion').optional().notEmpty().trim(),
  body('sitioWeb').optional().isURL(),
  body('ubicacion').optional().notEmpty().trim(),
  body('industria').optional().notEmpty().trim(),
  validate,
  ctrl.actualizarPerfil
);

router.get('/vacantes', ctrl.misVacantes);

router.get('/vacantes/:vacancyId/aplicaciones',
  param('vacancyId').isUUID(),
  validate,
  ctrl.aplicacionesDeVacante
);

router.patch('/aplicaciones/:applicationId/status',
  param('applicationId').isUUID(),
  body('status').isIn(APP_STATUSES),
  validate,
  ctrl.cambiarStatusAplicacion
);

export default router;
