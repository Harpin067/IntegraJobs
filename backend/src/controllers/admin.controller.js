// backend/src/controllers/admin.controller.js
import * as svc from '../services/admin.service.js';

export const listarUsuarios = async (req, res, next) => {
  try { res.json(await svc.listarUsuarios()); }
  catch (err) { next(err); }
};

export const toggleUsuario = async (req, res, next) => {
  try { res.json(await svc.toggleUsuario(req.params.userId)); }
  catch (err) { next(err); }
};

export const empresasPendientes = async (req, res, next) => {
  try { res.json(await svc.empresasPendientes()); }
  catch (err) { next(err); }
};

export const verificarEmpresa = async (req, res, next) => {
  try { res.json(await svc.verificarEmpresa(req.params.companyId, req.body.verificar)); }
  catch (err) { next(err); }
};

export const vacantesPendientes = async (req, res, next) => {
  try { res.json(await svc.vacantesPendientes()); }
  catch (err) { next(err); }
};

export const aprobarVacante = async (req, res, next) => {
  try { res.json(await svc.aprobarVacante(req.params.vacancyId, req.body.aprobar)); }
  catch (err) { next(err); }
};
