// backend/src/routes/public.routes.js
import { Router } from 'express';
import { getLandingStats } from '../services/public.service.js';

const router = Router();

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getLandingStats();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
