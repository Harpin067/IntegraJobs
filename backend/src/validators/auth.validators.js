// backend/src/validators/auth.validators.js
import { body } from 'express-validator';

export const loginRules = [
  body('email')
    .isEmail().withMessage('Ingresa un correo válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
  body('loginType')
    .isIn(['candidato', 'empresa', 'admin'])
    .withMessage('Tipo de acceso inválido'),
];

export const registroCandidatoRules = [
  body('email')
    .isEmail().withMessage('Ingresa un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una letra mayúscula')
    .matches(/\d/).withMessage('Debe contener al menos un número'),
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 80 }).withMessage('Máximo 80 caracteres')
    .trim(),
  body('apellidos')
    .notEmpty().withMessage('Los apellidos son requeridos')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres')
    .trim(),
  body('telefono')
    .optional({ checkFalsy: true })
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Formato de teléfono inválido')
    .trim(),
];

export const registroEmpresaRules = [
  body('email')
    .isEmail().withMessage('Ingresa un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una letra mayúscula')
    .matches(/\d/).withMessage('Debe contener al menos un número'),
  body('nombre')
    .notEmpty().withMessage('Tu nombre es requerido')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres')
    .trim(),
  body('empresaNombre')
    .notEmpty().withMessage('El nombre de la empresa es requerido')
    .isLength({ max: 160 }).withMessage('Máximo 160 caracteres')
    .trim(),
  body('descripcion')
    .optional({ checkFalsy: true })
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
