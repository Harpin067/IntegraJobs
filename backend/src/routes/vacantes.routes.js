// backend/src/routes/vacantes.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middlewares/error.middleware.js';
import {
  listarQueryRules,
  uuidParamRules,
  crearVacanteRules,
  actualizarVacanteRules,
  cambiarStatusRules,
} from '../validators/vacantes.validators.js';
import * as ctrl from '../controllers/vacantes.controller.js';

const router = Router();

router.get('/',
  listarQueryRules, validate,
  ctrl.listar
);

router.get('/empresa/mis-vacantes',
  requireAuth, requireRole('EMPRESA'),
  ctrl.misVacantes
);

router.get('/:id',
  uuidParamRules, validate,
  ctrl.detalle
);

router.post('/',
  requireAuth, requireRole('EMPRESA'),
  crearVacanteRules, validate,
  ctrl.crear
);

router.put('/:id',
  requireAuth, requireRole('EMPRESA'),
  actualizarVacanteRules, validate,
  ctrl.actualizar
);

router.patch('/:id/status',
  requireAuth, requireRole('EMPRESA'),
  cambiarStatusRules, validate,
  ctrl.cambiarStatus
);

export default router;
