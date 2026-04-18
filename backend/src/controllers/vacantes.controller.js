// backend/src/controllers/vacantes.controller.js
import * as svc from '../services/vacantes.service.js';

export const listar = async (req, res, next) => {
  try {
    const { tipo_trabajo, tipo_contrato, experiencia, ubicacion, q, page, limit } = req.query;
    const result = await svc.listar({ tipoTrabajo: tipo_trabajo, tipoContrato: tipo_contrato, experiencia, ubicacion, q, page, limit });
    res.json(result);
  } catch (err) { next(err); }
};

export const detalle = async (req, res, next) => {
  try {
    const vacante = await svc.detalle(req.params.id);
    res.json(vacante);
  } catch (err) { next(err); }
};

export const crear = async (req, res, next) => {
  try {
    const vacante = await svc.crear(req.user.companyId, req.body);
    res.status(201).json(vacante);
  } catch (err) { next(err); }
};

export const actualizar = async (req, res, next) => {
  try {
    const vacante = await svc.actualizar(req.params.id, req.user.companyId, req.body);
    res.json(vacante);
  } catch (err) { next(err); }
};

export const cambiarStatus = async (req, res, next) => {
  try {
    const vacante = await svc.cambiarStatus(req.params.id, req.user.companyId, req.body.status);
    res.json(vacante);
  } catch (err) { next(err); }
};

export const misVacantes = async (req, res, next) => {
  try {
    const vacantes = await svc.misVacantes(req.user.companyId);
    res.json(vacantes);
  } catch (err) { next(err); }
};
