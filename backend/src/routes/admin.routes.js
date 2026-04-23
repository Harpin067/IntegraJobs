// backend/src/routes/admin.routes.js
import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middlewares/error.middleware.js';
import * as ctrl from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireRole('SUPERADMIN'));

// ── Usuarios ──────────────────────────────────────────────
router.get('/usuarios', ctrl.listarUsuarios);

router.patch('/usuarios/:userId/toggle',
  param('userId').isUUID(),
  validate,
  ctrl.toggleUsuario
);

// ── Empresas ──────────────────────────────────────────────
router.get('/empresas', ctrl.listarEmpresas);

router.get('/empresas/pendientes', ctrl.empresasPendientes);

router.patch('/empresas/:companyId/verificar',
  param('companyId').isUUID(),
  body('verificar').isBoolean({ strict: false }),
  validate,
  ctrl.verificarEmpresa
);

// ── Vacantes ──────────────────────────────────────────────
router.get('/vacantes/pendientes', ctrl.vacantesPendientes);

router.patch('/vacantes/:vacancyId/aprobar',
  param('vacancyId').isUUID(),
  body('aprobar').isBoolean({ strict: false }),
  validate,
  ctrl.aprobarVacante
);

// ── Valoraciones ──────────────────────────────────────────
router.get('/valoraciones', ctrl.listarValoraciones);

router.patch('/valoraciones/:reviewId/aprobar',
  param('reviewId').isUUID(),
  body('aprobar').isBoolean({ strict: false }),
  validate,
  ctrl.aprobarValoracion
);

// ── Foros ──────────────────────────────────────────────────
router.get('/foros/categorias', ctrl.listarForoCategorias);

router.post('/foros/categorias',
  body('nombre').notEmpty().trim(),
  body('descripcion').optional().trim(),
  validate,
  ctrl.crearForoCategoria
);

router.delete('/foros/categorias/:categoryId', ctrl.eliminarForoCategoria);

router.get('/foros/threads', ctrl.listarForoThreads);

router.patch('/foros/threads/:threadId/moderar',
  body('aprobar').isBoolean({ strict: false }),
  validate,
  ctrl.moderarThread
);

router.delete('/foros/threads/:threadId', ctrl.eliminarThread);

// ── Stats / Charts ──────────────────────────────────────────
router.get('/stats/charts', ctrl.getChartStats);

// ── Recursos ────────────────────────────────────────────────
const TIPOS_RECURSO = ['articulo', 'tutorial', 'video'];

router.get('/recursos', ctrl.listarRecursos);

router.post('/recursos',
  body('titulo').notEmpty().withMessage('El título es requerido').isLength({ max: 200 }).trim(),
  body('contenido').notEmpty().withMessage('El contenido es requerido').isLength({ max: 8000 }).trim(),
  body('tipo').isIn(TIPOS_RECURSO).withMessage('Tipo inválido. Opciones: articulo, tutorial, video'),
  body('imagenUrl').optional({ checkFalsy: true }).isURL().withMessage('URL de imagen inválida').trim(),
  body('isPublished').optional().isBoolean({ strict: false }),
  validate,
  ctrl.crearRecurso
);

router.patch('/recursos/:resourceId/toggle',
  param('resourceId').isUUID().withMessage('ID de recurso inválido'),
  validate,
  ctrl.toggleRecurso
);

router.delete('/recursos/:resourceId',
  param('resourceId').isUUID().withMessage('ID de recurso inválido'),
  validate,
  ctrl.eliminarRecurso
);

export default router;
