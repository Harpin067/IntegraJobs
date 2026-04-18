// backend/src/controllers/candidato.controller.js
import * as svc from '../services/candidato.service.js';

export const getPerfil = async (req, res, next) => {
  try { res.json(await svc.getPerfil(req.user.id)); }
  catch (err) { next(err); }
};

export const actualizarPerfil = async (req, res, next) => {
  try { res.json(await svc.actualizarPerfil(req.user.id, req.body)); }
  catch (err) { next(err); }
};

export const postular = async (req, res, next) => {
  try {
    const aplicacion = await svc.postular(req.user.id, req.params.vacancyId, req.body.mensaje);
    res.status(201).json(aplicacion);
  } catch (err) { next(err); }
};

export const misPostulaciones = async (req, res, next) => {
  try { res.json(await svc.misPostulaciones(req.user.id)); }
  catch (err) { next(err); }
};
