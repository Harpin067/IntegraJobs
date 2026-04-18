// backend/src/controllers/auth.controller.js
import * as authService from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) { next(err); }
};

export const registrarCandidato = async (req, res, next) => {
  try {
    const result = await authService.registrarCandidato(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const registrarEmpresa = async (req, res, next) => {
  try {
    const result = await authService.registrarEmpresa(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};
