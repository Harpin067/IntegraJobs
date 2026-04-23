// backend/src/routes/public.routes.js
import { Router } from 'express';
import {
  getLandingStats,
  buscarVacantes,
  detalleVacante,
  getRecursos,
  getForoCategories,
  getForoThreads,
  getForoThread,
  getEmpresaReviews,
} from '../services/public.service.js';

const router = Router();

// ── Stats landing ─────────────────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try { res.json(await getLandingStats()); } catch (err) { next(err); }
});

// ── Vacantes públicas ─────────────────────────────────────────────────
router.get('/vacantes', async (req, res, next) => {
  try {
    const { q, ubicacion, tipoTrabajo, tipoContrato, experiencia, salarioMin, salarioMax, page, limit } = req.query;
    res.json(await buscarVacantes({ q, ubicacion, tipoTrabajo, tipoContrato, experiencia, salarioMin, salarioMax, page, limit }));
  } catch (err) { next(err); }
});

router.get('/vacantes/:id', async (req, res, next) => {
  try { res.json(await detalleVacante(req.params.id)); } catch (err) { next(err); }
});

// ── Recursos ──────────────────────────────────────────────────────────
router.get('/recursos', async (req, res, next) => {
  try { res.json(await getRecursos(req.query.tipo ?? null)); } catch (err) { next(err); }
});

// ── Foros ─────────────────────────────────────────────────────────────
router.get('/foros', async (_req, res, next) => {
  try { res.json(await getForoCategories()); } catch (err) { next(err); }
});

// Specific route BEFORE the parameterized one to avoid shadowing
router.get('/foros/threads/:threadId', async (req, res, next) => {
  try { res.json(await getForoThread(req.params.threadId)); } catch (err) { next(err); }
});

router.get('/foros/:categoryId/threads', async (req, res, next) => {
  try { res.json(await getForoThreads(req.params.categoryId)); } catch (err) { next(err); }
});

// ── Reviews de empresa ────────────────────────────────────────────────
router.get('/empresas/:companyId/reviews', async (req, res, next) => {
  try { res.json(await getEmpresaReviews(req.params.companyId)); } catch (err) { next(err); }
});

export default router;
