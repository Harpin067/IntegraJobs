// backend/src/routes/empresa.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middlewares/error.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  updatePerfilRules,
  crearVacanteEmpresaRules,
  actualizarVacanteEmpresaRules,
  updateStatusAplicacionRules,
} from '../validators/empresa.validators.js';
import { empresaController } from '../controllers/empresa.controller.js';

const router = Router();

router.use(requireAuth, requireRole('EMPRESA'));

// ── Perfil ──────────────────────────────────────────────────────────
router.get('/perfil',       empresaController.getPerfil);
router.put('/perfil',       updatePerfilRules, validate, empresaController.updatePerfil);
router.post('/perfil/logo', upload.single('logo'), empresaController.uploadLogo);

// ── Vacantes ─────────────────────────────────────────────────────────
router.get('/vacantes',          empresaController.getMisVacantes);
router.post('/vacantes',         crearVacanteEmpresaRules,    validate, empresaController.createVacante);
router.put('/vacantes/:id',      actualizarVacanteEmpresaRules, validate, empresaController.updateVacante);

// ── ATS ───────────────────────────────────────────────────────────────
router.get('/vacantes/:id/aplicaciones',       empresaController.getAplicacionesPorVacante);
router.patch('/aplicaciones/:id/status',       updateStatusAplicacionRules, validate, empresaController.updateStatusAplicacion);

export default router;
