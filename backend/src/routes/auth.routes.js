// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { validate } from '../middlewares/error.middleware.js';
import { loginRules, registroCandidatoRules, registroEmpresaRules } from '../validators/auth.validators.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

router.post('/login',            loginRules,             validate, ctrl.login);
router.post('/registro/candidato', registroCandidatoRules, validate, ctrl.registrarCandidato);
router.post('/registro/empresa',   registroEmpresaRules,   validate, ctrl.registrarEmpresa);

export default router;
