// frontend/js/pages/registro-candidato.js
import { apiFetch } from '/js/api.js';
import { redirectByRole } from '/js/auth.js';
import { FormValidator } from '/js/form-validator.js';

document.addEventListener('DOMContentLoaded', () => {
  const alertEl = document.getElementById('alertEl');
  const btn     = document.getElementById('btn-submit');
  const form    = document.getElementById('registroForm');

  const showError = (m) => { alertEl.textContent = m; alertEl.classList.add('show'); };
  const hideError = ()  => { alertEl.classList.remove('show'); };

  FormValidator.watchReset(form);

  const RULES = {
    nombre:          [{ rule: 'required', message: 'El nombre es requerido' },
                      { rule: 'maxLength', value: 80 }],
    apellidos:       [{ rule: 'required', message: 'Los apellidos son requeridos' },
                      { rule: 'maxLength', value: 120 }],
    email:           [{ rule: 'required' }, { rule: 'email' }],
    telefono:        [{ rule: 'pattern', value: '^[+\\d\\s\\-()]{7,20}$',
                        message: 'Formato de teléfono inválido (ej. +503 7000-0000)' }],
    password:        [{ rule: 'required' }, { rule: 'password' }],
    confirmPassword: [{ rule: 'required', message: 'Confirma tu contraseña' },
                      { rule: 'match', value: 'password', message: 'Las contraseñas no coinciden' }],
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    FormValidator.clearErrors(form);

    const { valid } = FormValidator.validate(form, RULES, alertEl);
    if (!valid) return;

    btn.disabled    = true;
    btn.textContent = 'Creando cuenta...';

    try {
      const data = await apiFetch('/auth/registro/candidato', {
        method: 'POST',
        body: JSON.stringify({
          email:     form.elements.email.value.trim(),
          password:  form.elements.password.value,
          nombre:    form.elements.nombre.value.trim(),
          apellidos: form.elements.apellidos.value.trim(),
          telefono:  form.elements.telefono?.value.trim() || undefined,
        }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      redirectByRole(data.user.role);
    } catch (err) {
      if (err.data?.details) {
        FormValidator.showApiErrors(form, err.data.details, alertEl);
      } else {
        showError(err.message ?? 'Error al registrarse. Intenta de nuevo.');
      }
      btn.disabled    = false;
      btn.textContent = 'Crear cuenta gratis';
    }
  });
});
