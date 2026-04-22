import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Datos inválidos',
      details: errors.array().map(e => ({ campo: e.path ?? e.param, mensaje: e.msg })),
    });
  }
  next();
};
