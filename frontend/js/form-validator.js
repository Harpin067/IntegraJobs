// frontend/js/form-validator.js
//
// Motor de validación de formularios genérico y adaptable.
// Compatible con los contenedores .field (auth/registro) y .ij-form-group (dashboard).
//
// Uso:
//   import { FormValidator } from '/js/form-validator.js';
//   const { valid, errors } = FormValidator.validate(form, rules, summaryEl?);
//
// Formato de reglas:
//   { fieldName: [{ rule, value?, message? }, ...] }
//
// Reglas disponibles:
//   required, email, minLength, maxLength, min, max,
//   pattern, match (confirmar campo), isIn, url

const MESSAGES = {
  required:  () => 'Este campo es requerido',
  email:     () => 'Ingresa un correo electrónico válido',
  minLength: (v) => `Mínimo ${v} caracteres`,
  maxLength: (v) => `Máximo ${v} caracteres`,
  min:       (v) => `El valor mínimo es ${v}`,
  max:       (v) => `El valor máximo es ${v}`,
  pattern:   () => 'Formato inválido',
  match:     (v) => `Este campo no coincide con ${v}`,
  isIn:      (v) => `Selecciona una opción válida`,
  url:       () => 'Ingresa una URL válida (ej. https://ejemplo.com)',
  password:  () => 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número',
};

const VALIDATORS = {
  required:  (val)      => val.trim().length > 0,
  email:     (val)      => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
  minLength: (val, v)   => val.trim().length >= Number(v),
  maxLength: (val, v)   => val.trim().length <= Number(v),
  min:       (val, v)   => !isNaN(val) && Number(val) >= Number(v),
  max:       (val, v)   => !isNaN(val) && Number(val) <= Number(v),
  pattern:   (val, v)   => new RegExp(v).test(val.trim()),
  match:     (val, v, form) => {
    const other = form.elements[v];
    return other ? val === other.value : true;
  },
  isIn:      (val, v)   => (Array.isArray(v) ? v : v.split(',')).includes(val),
  url:       (val)      => {
    if (!val.trim()) return true; // opcional si no hay `required`
    try { new URL(val.trim()); return true; } catch { return false; }
  },
  password:  (val)      => val.length >= 8 && /[A-Z]/.test(val) && /\d/.test(val),
};

function getWrapper(input) {
  return (
    input.closest('.field') ||
    input.closest('.ij-form-group') ||
    input.parentElement
  );
}

function showFieldError(input, message) {
  const wrapper = getWrapper(input);
  input.classList.add('is-invalid');
  wrapper.querySelector('.field-error-msg')?.remove();
  const span = document.createElement('span');
  span.className = 'field-error-msg';
  span.setAttribute('role', 'alert');
  span.textContent = message;
  wrapper.appendChild(span);
}

function clearFieldError(input) {
  const wrapper = getWrapper(input);
  input.classList.remove('is-invalid');
  wrapper.querySelector('.field-error-msg')?.remove();
}

function getFieldValue(form, name) {
  const el = form.elements[name];
  if (!el) return '';
  if (el.type === 'checkbox') return el.checked ? 'true' : '';
  return el.value ?? '';
}

export const FormValidator = {
  /**
   * Valida el formulario contra las reglas dadas.
   * @param {HTMLFormElement} form
   * @param {Object} rules  — { fieldName: [{ rule, value?, message? }] }
   * @param {HTMLElement|null} summaryEl — elemento .form-alert para mostrar resumen
   * @returns {{ valid: boolean, errors: Object }}
   */
  validate(form, rules, summaryEl = null) {
    const errors = {};

    for (const [name, fieldRules] of Object.entries(rules)) {
      const input = form.elements[name];
      if (!input) continue;

      clearFieldError(input);

      const rawValue = getFieldValue(form, name);

      // Si el campo no es required y está vacío, saltar validaciones opcionales
      const isRequired = fieldRules.some(r => r.rule === 'required');
      if (!isRequired && rawValue.trim() === '') continue;

      for (const { rule, value, message } of fieldRules) {
        const fn = VALIDATORS[rule];
        if (!fn) continue;

        const passes = fn(rawValue, value, form);
        if (!passes) {
          const msg = message ?? (MESSAGES[rule]?.(value) ?? 'Valor inválido');
          errors[name] = msg;
          showFieldError(input, msg);
          break; // un error por campo
        }
      }
    }

    if (summaryEl) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        summaryEl.textContent = firstError;
        summaryEl.classList.add('show');
      } else {
        summaryEl.classList.remove('show');
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  },

  /**
   * Limpia todos los errores inline del formulario.
   */
  clearErrors(form) {
    Array.from(form.elements).forEach(clearFieldError);
  },

  /**
   * Proyecta errores de la API (422 { details: [{ campo, mensaje }] })
   * sobre los campos del formulario.
   * @param {HTMLFormElement} form
   * @param {Array}  details   — array de { campo, mensaje }
   * @param {HTMLElement|null} summaryEl
   */
  showApiErrors(form, details = [], summaryEl = null) {
    if (!details.length) return;

    details.forEach(({ campo, mensaje }) => {
      const input = form.elements[campo];
      if (input) showFieldError(input, mensaje);
    });

    if (summaryEl) {
      summaryEl.textContent = details[0].mensaje;
      summaryEl.classList.add('show');
    }
  },

  /**
   * Registra listeners `input` para limpiar el error de un campo al escribir.
   * Llamar una vez después de montar el formulario.
   */
  watchReset(form) {
    Array.from(form.elements).forEach(input => {
      input.addEventListener('input', () => clearFieldError(input), { once: false });
    });
  },
};
