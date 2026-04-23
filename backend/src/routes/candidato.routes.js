// backend/src/routes/candidato.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as ctrl from '../controllers/candidato.controller.js';

const router = Router();

router.use(requireAuth, requireRole('CANDIDATO'));

// ── Perfil ────────────────────────────────────────────────────────────
router.get('/perfil', ctrl.getPerfil);

router.post('/perfil/avatar',
  upload.single('avatar'),
  ctrl.subirAvatar
);

router.post('/perfil/cv',
  upload.single('cv'),
  ctrl.subirCv
);

router.put('/perfil',
  body('nombre').optional().notEmpty().trim(),
  body('apellidos').optional().notEmpty().trim(),
  body('telefono').optional().trim(),
  validate,
  ctrl.actualizarPerfil
);

// ── Postulaciones ─────────────────────────────────────────────────────
router.post('/postulaciones/:vacancyId',
  param('vacancyId').isUUID(),
  body('mensaje').optional().trim(),
  validate,
  ctrl.postular
);

router.get('/postulaciones', ctrl.misPostulaciones);

// ── Alertas ───────────────────────────────────────────────────────────
router.get('/alertas', ctrl.getAlertas);

router.post('/alertas',
  body('keyword').notEmpty().trim(),
  body('ubicacion').optional().trim(),
  body('tipoTrabajo').optional().isIn(['presencial', 'remoto', 'hibrido']),
  validate,
  ctrl.crearAlerta
);

router.patch('/alertas/:id/toggle',
  param('id').notEmpty(),
  validate,
  ctrl.toggleAlerta
);

router.delete('/alertas/:id',
  param('id').notEmpty(),
  validate,
  ctrl.eliminarAlerta
);

// ── Reviews / Valoraciones ────────────────────────────────────────────
router.get('/reviews', ctrl.misReviews);

router.post('/reviews/:companyId',
  param('companyId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comentario').notEmpty().trim(),
  validate,
  ctrl.crearReview
);

// ── Foros ─────────────────────────────────────────────────────────────
router.post('/foros/threads',
  body('categoryId').notEmpty(),
  body('titulo').notEmpty().trim(),
  body('contenido').notEmpty().trim(),
  validate,
  ctrl.crearThread
);

router.post('/foros/threads/:threadId/replies',
  param('threadId').notEmpty(),
  body('contenido').notEmpty().trim(),
  validate,
  ctrl.crearReply
);

export default router;
