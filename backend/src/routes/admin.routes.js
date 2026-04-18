// backend/src/routes/admin.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireRole('SUPERADMIN'));

router.get('/usuarios', ctrl.listarUsuarios);

router.patch('/usuarios/:userId/toggle',
  param('userId').isUUID(),
  validate,
  ctrl.toggleUsuario
);

router.get('/empresas/pendientes', ctrl.empresasPendientes);

router.patch('/empresas/:companyId/verificar',
  param('companyId').isUUID(),
  body('verificar').isBoolean(),
  validate,
  ctrl.verificarEmpresa
);

router.get('/vacantes/pendientes', ctrl.vacantesPendientes);

router.patch('/vacantes/:vacancyId/aprobar',
  param('vacancyId').isUUID(),
  body('aprobar').isBoolean(),
  validate,
  ctrl.aprobarVacante
);

export default router;
