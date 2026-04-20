// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/error.middleware.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('loginType').isIn(['candidato', 'empresa', 'admin']),
  validate,
  ctrl.login
);

router.post('/registro/candidato',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  body('nombre').notEmpty().trim(),
  body('apellidos').notEmpty().trim(),
  validate,
  ctrl.registrarCandidato
);

router.post('/registro/empresa',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  body('nombre').notEmpty().trim(),
  body('empresaNombre').notEmpty().trim(),
  body('descripcion').optional().trim(),
  body('ubicacion').notEmpty().trim(),
  body('industria').notEmpty().trim(),
  body('sitioWeb').optional().trim(),
  validate,
  ctrl.registrarEmpresa
);

export default router;
