import * as authService from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    res.json(await authService.login(req.body));
  } catch (err) { next(err); }
};

export const registrarCandidato = async (req, res, next) => {
  try {
    res.status(201).json(await authService.registrarCandidato(req.body));
  } catch (err) { next(err); }
};

export const registrarEmpresa = async (req, res, next) => {
  try {
    res.status(201).json(await authService.registrarEmpresa(req.body));
  } catch (err) { next(err); }
};
