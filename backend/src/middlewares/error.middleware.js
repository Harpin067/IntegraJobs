import { validationResult } from 'express-validator';

// 422 uniforme para express-validator
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(422).json({
    error: 'Datos inválidos',
    details: errors.array().map(e => ({ campo: e.path, mensaje: e.msg })),
  });
};

// 404 solo bajo /api
export const notFound = (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

// Manejador global (firma 4-args requerida por Express)
export const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode ?? 500;
  const message = status === 500 ? 'Error interno del servidor' : err.message;
  if (status === 500) console.error('[ERROR]', err);
  res.status(status).json({ error: message });
};

// Helper para lanzar errores HTTP desde services
export const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};
