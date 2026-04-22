import { Router } from 'express';
import { body } from 'express-validator';

import { empresaController } from '../controllers/empresa.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

/* =========================
   MIDDLEWARE GLOBAL
========================= */
router.use(requireAuth);
router.use(requireRole('EMPRESA'));

/* =========================
   PERFIL
========================= */

router.get('/perfil', empresaController.getPerfil);

router.put('/perfil', [
    body('nombre').notEmpty(),
    body('descripcion').notEmpty(),
    body('ubicacion').notEmpty(),
    body('industria').notEmpty(),
    body('sitioWeb').optional().isURL(),
    validate
], empresaController.updatePerfil);

router.post(
    '/perfil/logo',
    upload.single('logo'),
    empresaController.uploadLogo
);

/* =========================
   VACANTES
========================= */

router.get('/vacantes', empresaController.getMisVacantes);

router.post('/vacantes', [
    body('titulo').notEmpty(),
    body('descripcion').notEmpty(),
    body('requisitos').notEmpty(),
    body('ubicacion').notEmpty(),
    body('tipoTrabajo').isIn(['presencial', 'remoto', 'hibrido']),
    body('tipoContrato').isIn(['completo', 'medio', 'temporal', 'freelance']),
    body('experiencia').isIn(['junior', 'mid', 'senior', 'lead']),
    body('contacto').notEmpty(),
    body('salarioMin').optional().isNumeric(),
    body('salarioMax').optional().isNumeric(),
    validate
], empresaController.createVacante);

router.put('/vacantes/:id', [
    body('titulo').optional(),
    body('descripcion').optional(),
    body('requisitos').optional(),
    body('ubicacion').optional(),
    body('status').optional().isIn(['activa', 'pausada', 'cerrada']),
    validate
], empresaController.updateVacante);

/* =========================
   ATS
========================= */

router.get('/vacantes/:id/aplicaciones', empresaController.getAplicacionesPorVacante);

router.patch('/aplicaciones/:id/status', [
    body('status').isIn(['nuevo', 'en_proceso', 'rechazado', 'contratado']),
    validate
], empresaController.updateStatusAplicacion);

export default router;
