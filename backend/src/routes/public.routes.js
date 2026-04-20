// backend/src/routes/public.routes.js
import { Router } from 'express';
import { getLandingStats, buscarVacantes, detalleVacante } from '../services/public.service.js';

const router = Router();

router.get('/stats', async (req, res, next) => {
  try {
    res.json(await getLandingStats());
  } catch (err) { next(err); }
});

router.get('/vacantes', async (req, res, next) => {
  try {
    const { q, ubicacion, page, limit } = req.query;
    res.json(await buscarVacantes({ q, ubicacion, page, limit }));
  } catch (err) { next(err); }
});

router.get('/vacantes/:id', async (req, res, next) => {
  try {
    res.json(await detalleVacante(req.params.id));
  } catch (err) { next(err); }
});

export default router;
