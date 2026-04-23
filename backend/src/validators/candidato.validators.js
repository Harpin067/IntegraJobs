// backend/src/validators/candidato.validators.js
import { body, param } from 'express-validator';

export const actualizarPerfilRules = [
  body('nombre')
    .optional({ checkFalsy: true })
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 80 }).withMessage('Máximo 80 caracteres')
    .trim(),
  body('apellidos')
    .optional({ checkFalsy: true })
    .notEmpty().withMessage('Los apellidos no pueden estar vacíos')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres')
    .trim(),
  body('telefono')
    .optional({ checkFalsy: true })
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Formato de teléfono inválido')
    .trim(),
  body('ubicacion')
    .optional({ checkFalsy: true })
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres')
    .trim(),
  body('habilidades')
    .optional()
    .isArray({ max: 30 }).withMessage('Máximo 30 habilidades'),
  body('habilidades.*')
    .optional()
    .isString()
    .isLength({ max: 50 }).withMessage('Cada habilidad tiene un máximo de 50 caracteres')
    .trim(),
];

export const postularRules = [
  param('vacancyId').isUUID().withMessage('ID de vacante inválido'),
  body('mensaje')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 }).withMessage('El mensaje no puede superar 1000 caracteres')
    .trim(),
];

export const crearAlertaRules = [
  body('keyword')
    .notEmpty().withMessage('La palabra clave es requerida')
    .isLength({ max: 80 }).withMessage('Máximo 80 caracteres')
    .trim(),
  body('ubicacion')
    .optional({ checkFalsy: true })
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres')
    .trim(),
  body('tipoTrabajo')
    .optional({ checkFalsy: true })
    .isIn(['presencial', 'remoto', 'hibrido']).withMessage('Modalidad inválida'),
];

export const alertaIdRules = [
  param('id').notEmpty().withMessage('ID de alerta requerido'),
];

export const crearReviewRules = [
  param('companyId').isUUID().withMessage('ID de empresa inválido'),
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('La valoración debe ser un número entre 1 y 5'),
  body('comentario')
    .notEmpty().withMessage('El comentario es requerido')
    .isLength({ min: 10, max: 1200 }).withMessage('El comentario debe tener entre 10 y 1200 caracteres')
    .trim(),
];

export const crearThreadRules = [
  body('categoryId').isUUID().withMessage('ID de categoría inválido'),
  body('titulo')
    .notEmpty().withMessage('El título es requerido')
    .isLength({ max: 200 }).withMessage('Máximo 200 caracteres')
    .trim(),
  body('contenido')
    .notEmpty().withMessage('El contenido es requerido')
    .isLength({ min: 10, max: 8000 }).withMessage('El contenido debe tener entre 10 y 8000 caracteres')
    .trim(),
];

export const crearReplyRules = [
  param('threadId').isUUID().withMessage('ID de hilo inválido'),
  body('contenido')
    .notEmpty().withMessage('La respuesta no puede estar vacía')
    .isLength({ min: 2, max: 4000 }).withMessage('La respuesta debe tener entre 2 y 4000 caracteres')
    .trim(),
];
