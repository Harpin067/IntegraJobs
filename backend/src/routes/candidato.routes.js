// backend/src/routes/candidato.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/candidato.controller.js';

const router = Router();

router.use(requireAuth, requireRole('CANDIDATO'));

router.get('/perfil', ctrl.getPerfil);

router.put('/perfil',
  body('nombre').optional().notEmpty().trim(),
  body('apellidos').optional().notEmpty().trim(),
  body('telefono').optional().trim(),
  body('cvUrl').optional().isURL(),
  validate,
  ctrl.actualizarPerfil
);

router.post('/postulaciones/:vacancyId',
  param('vacancyId').isUUID(),
  body('mensaje').optional().trim(),
  validate,
  ctrl.postular
);

router.get('/postulaciones', ctrl.misPostulaciones);

export default router;
