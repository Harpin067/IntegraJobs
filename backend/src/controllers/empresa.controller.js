// backend/src/controllers/empresa.controller.js
import * as svc from '../services/empresa.service.js';

export const getPerfil = async (req, res, next) => {
  try { res.json(await svc.getPerfil(req.user.companyId)); }
  catch (err) { next(err); }
};

export const actualizarPerfil = async (req, res, next) => {
  try { res.json(await svc.actualizarPerfil(req.user.companyId, req.body)); }
  catch (err) { next(err); }
};

export const misVacantes = async (req, res, next) => {
  try { res.json(await svc.misVacantes(req.user.companyId)); }
  catch (err) { next(err); }
};

export const aplicacionesDeVacante = async (req, res, next) => {
  try {
    const data = await svc.aplicacionesDeVacante(req.params.vacancyId, req.user.companyId);
    res.json(data);
  } catch (err) { next(err); }
};

export const cambiarStatusAplicacion = async (req, res, next) => {
  try {
    const data = await svc.cambiarStatusAplicacion(req.params.applicationId, req.user.companyId, req.body.status);
    res.json(data);
  } catch (err) { next(err); }
};
