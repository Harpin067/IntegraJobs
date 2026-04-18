// backend/src/routes/vacantes.routes.js
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as ctrl from '../controllers/vacantes.controller.js';

const router = Router();

const TIPOS_TRABAJO  = ['presencial', 'remoto', 'hibrido'];
const TIPOS_CONTRATO = ['completo', 'medio', 'temporal', 'freelance'];
const EXPERIENCIAS   = ['junior', 'mid', 'senior', 'lead'];
const STATUSES       = ['activa', 'pausada', 'cerrada'];

router.get('/',
  query('tipo_trabajo').optional().isIn(TIPOS_TRABAJO),
  query('tipo_contrato').optional().isIn(TIPOS_CONTRATO),
  query('experiencia').optional().isIn(EXPERIENCIAS),
  query('page').optional().isInt({ min: 1 }),
  validate,
  ctrl.listar
);

router.get('/empresa/mis-vacantes',
  requireAuth, requireRole('EMPRESA'),
  ctrl.misVacantes
);

router.get('/:id',
  param('id').isUUID(),
  validate,
  ctrl.detalle
);

router.post('/',
  requireAuth, requireRole('EMPRESA'),
  body('titulo').notEmpty().trim(),
  body('descripcion').notEmpty().trim(),
  body('requisitos').notEmpty().trim(),
  body('ubicacion').notEmpty().trim(),
  body('tipoTrabajo').isIn(TIPOS_TRABAJO),
  body('tipoContrato').isIn(TIPOS_CONTRATO),
  body('experiencia').isIn(EXPERIENCIAS),
  body('contacto').notEmpty().trim(),
  body('salarioMin').optional().isFloat({ min: 0 }),
  body('salarioMax').optional().isFloat({ min: 0 }),
  validate,
  ctrl.crear
);

router.put('/:id',
  requireAuth, requireRole('EMPRESA'),
  param('id').isUUID(),
  body('titulo').optional().notEmpty().trim(),
  body('descripcion').optional().notEmpty().trim(),
  validate,
  ctrl.actualizar
);

router.patch('/:id/status',
  requireAuth, requireRole('EMPRESA'),
  param('id').isUUID(),
  body('status').isIn(STATUSES),
  validate,
  ctrl.cambiarStatus
);

export default router;
