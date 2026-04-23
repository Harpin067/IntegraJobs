// backend/src/validators/empresa.validators.js
import { body, param } from 'express-validator';

const TIPOS_TRABAJO  = ['presencial', 'remoto', 'hibrido'];
const TIPOS_CONTRATO = ['completo', 'medio', 'temporal', 'freelance'];
const EXPERIENCIAS   = ['junior', 'mid', 'senior', 'lead'];

export const updatePerfilRules = [
  body('nombre')
    .notEmpty().withMessage('El nombre de la empresa es requerido')
    .isLength({ max: 160 }).withMessage('Máximo 160 caracteres')
    .trim(),
  body('descripcion')
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ max: 1200 }).withMessage('Máximo 1200 caracteres')
    .trim(),
  body('ubicacion')
    .notEmpty().withMessage('La ubicación es requerida')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres')
    .trim(),
  body('industria')
    .notEmpty().withMessage('La industria es requerida')
    .isLength({ max: 80 }).withMessage('Máximo 80 caracteres')
    .trim(),
  body('sitioWeb')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: true }).withMessage('Ingresa una URL válida (ej. https://tuempresa.com)')
    .trim(),
];

export const crearVacanteEmpresaRules = [
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

export const actualizarVacanteEmpresaRules = [
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
  body('status')
    .optional()
    .isIn(['activa', 'pausada', 'cerrada']).withMessage('Estado inválido'),
];

export const updateStatusAplicacionRules = [
  param('id').isUUID().withMessage('ID de aplicación inválido'),
  body('status')
    .isIn(['nuevo', 'en_proceso', 'rechazado', 'contratado'])
    .withMessage('Estado de aplicación inválido'),
];
