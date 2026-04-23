// backend/src/validators/vacantes.validators.js
import { body, param, query } from 'express-validator';

const TIPOS_TRABAJO  = ['presencial', 'remoto', 'hibrido'];
const TIPOS_CONTRATO = ['completo', 'medio', 'temporal', 'freelance'];
const EXPERIENCIAS   = ['junior', 'mid', 'senior', 'lead'];
const STATUSES       = ['activa', 'pausada', 'cerrada'];

export const listarQueryRules = [
  query('tipo_trabajo').optional().isIn(TIPOS_TRABAJO).withMessage('Modalidad inválida'),
  query('tipo_contrato').optional().isIn(TIPOS_CONTRATO).withMessage('Tipo de contrato inválido'),
  query('experiencia').optional().isIn(EXPERIENCIAS).withMessage('Nivel de experiencia inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('El límite debe estar entre 1 y 50'),
];

export const uuidParamRules = [
  param('id').isUUID().withMessage('ID de vacante inválido'),
];

export const crearVacanteRules = [
  body('titulo')
    .notEmpty().withMessage('El título es requerido')
    .isLength({ max: 160 }).withMessage('Máximo 160 caracteres')
    .trim(),
  body('descripcion')
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ max: 4000 }).withMessage('Máximo 4000 caracteres')
    .trim(),
  body('requisitos')
    .notEmpty().withMessage('Los requisitos son requeridos')
    .isLength({ max: 4000 }).withMessage('Máximo 4000 caracteres')
    .trim(),
  body('ubicacion')
    .notEmpty().withMessage('La ubicación es requerida')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres')
    .trim(),
  body('tipoTrabajo')
    .isIn(TIPOS_TRABAJO).withMessage('Modalidad inválida'),
  body('tipoContrato')
    .isIn(TIPOS_CONTRATO).withMessage('Tipo de contrato inválido'),
  body('experiencia')
    .isIn(EXPERIENCIAS).withMessage('Nivel de experiencia inválido'),
  body('contacto')
    .notEmpty().withMessage('El contacto es requerido')
    .isLength({ max: 160 }).withMessage('Máximo 160 caracteres')
    .trim(),
  body('salarioMin')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('El salario mínimo debe ser un número positivo'),
  body('salarioMax')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('El salario máximo debe ser un número positivo')
    .custom((max, { req }) => {
      const min = parseFloat(req.body.salarioMin);
      if (min && parseFloat(max) < min) {
        throw new Error('El salario máximo no puede ser menor al mínimo');
      }
      return true;
    }),
];

export const actualizarVacanteRules = [
  param('id').isUUID().withMessage('ID de vacante inválido'),
  body('titulo')
    .optional()
    .notEmpty().withMessage('El título no puede estar vacío')
    .isLength({ max: 160 }).withMessage('Máximo 160 caracteres')
    .trim(),
  body('descripcion')
    .optional()
    .notEmpty().withMessage('La descripción no puede estar vacía')
    .isLength({ max: 4000 }).withMessage('Máximo 4000 caracteres')
    .trim(),
  body('requisitos')
    .optional()
    .notEmpty().withMessage('Los requisitos no pueden estar vacíos')
    .isLength({ max: 4000 }).withMessage('Máximo 4000 caracteres')
    .trim(),
  body('ubicacion')
    .optional()
    .notEmpty().withMessage('La ubicación no puede estar vacía')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres')
    .trim(),
  body('tipoTrabajo')
    .optional()
    .isIn(TIPOS_TRABAJO).withMessage('Modalidad inválida'),
  body('tipoContrato')
    .optional()
    .isIn(TIPOS_CONTRATO).withMessage('Tipo de contrato inválido'),
  body('experiencia')
    .optional()
    .isIn(EXPERIENCIAS).withMessage('Nivel de experiencia inválido'),
  body('contacto')
    .optional()
    .notEmpty().withMessage('El contacto no puede estar vacío')
    .isLength({ max: 160 }).withMessage('Máximo 160 caracteres')
    .trim(),
  body('salarioMin')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Salario mínimo inválido'),
  body('salarioMax')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Salario máximo inválido')
    .custom((max, { req }) => {
      const min = parseFloat(req.body.salarioMin);
      if (min && parseFloat(max) < min) {
        throw new Error('El salario máximo no puede ser menor al mínimo');
      }
      return true;
    }),
];

export const cambiarStatusRules = [
  param('id').isUUID().withMessage('ID de vacante inválido'),
  body('status').isIn(STATUSES).withMessage('Estado inválido. Valores permitidos: activa, pausada, cerrada'),
];
