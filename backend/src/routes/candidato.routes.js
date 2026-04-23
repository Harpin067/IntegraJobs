// backend/src/routes/candidato.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middlewares/error.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  actualizarPerfilRules,
  postularRules,
  crearAlertaRules,
  alertaIdRules,
  crearReviewRules,
  crearThreadRules,
  crearReplyRules,
} from '../validators/candidato.validators.js';
import * as ctrl from '../controllers/candidato.controller.js';

const router = Router();

router.use(requireAuth, requireRole('CANDIDATO'));

// ── Perfil ──────────────────────────────────────────────────────────
router.get('/perfil', ctrl.getPerfil);
router.post('/perfil/avatar', upload.single('avatar'), ctrl.subirAvatar);
router.post('/perfil/cv',     upload.single('cv'),     ctrl.subirCv);
router.put('/perfil',         actualizarPerfilRules, validate, ctrl.actualizarPerfil);

// ── Postulaciones ───────────────────────────────────────────────────
router.post('/postulaciones/:vacancyId', postularRules, validate, ctrl.postular);
router.get('/postulaciones', ctrl.misPostulaciones);

// ── Alertas ─────────────────────────────────────────────────────────
router.get('/alertas/matches',             ctrl.getAlertaMatches);
router.get('/alertas',                     ctrl.getAlertas);
router.post('/alertas',                    crearAlertaRules, validate, ctrl.crearAlerta);
router.patch('/alertas/:id/toggle',        alertaIdRules, validate, ctrl.toggleAlerta);
router.delete('/alertas/:id',              alertaIdRules, validate, ctrl.eliminarAlerta);

// ── Reviews ─────────────────────────────────────────────────────────
router.get('/reviews', ctrl.misReviews);
router.post('/reviews/:companyId', crearReviewRules, validate, ctrl.crearReview);

// ── Foros ────────────────────────────────────────────────────────────
router.post('/foros/threads',                   crearThreadRules, validate, ctrl.crearThread);
router.post('/foros/threads/:threadId/replies', crearReplyRules,  validate, ctrl.crearReply);

export default router;
