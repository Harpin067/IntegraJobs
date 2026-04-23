// frontend/js/pages/registro-empresa.js
import { apiFetch } from '/js/api.js';
import { FormValidator } from '/js/form-validator.js';

document.addEventListener('DOMContentLoaded', () => {
  const alertEl = document.getElementById('alertEl');
  const btn     = document.getElementById('btn-submit');
  const form    = document.getElementById('registroForm');

  const showError = (m) => { alertEl.textContent = m; alertEl.classList.add('show'); };
  const hideError = ()  => { alertEl.classList.remove('show'); };

  FormValidator.watchReset(form);

  const RULES = {
    empresaNombre: [{ rule: 'required', message: 'El nombre de la empresa es requerido' },
                    { rule: 'maxLength', value: 160 }],
    industria:     [{ rule: 'required', message: 'Selecciona una industria' }],
    ubicacion:     [{ rule: 'required', message: 'Selecciona la ubicación' }],
    sitioWeb:      [{ rule: 'url', message: 'Ingresa una URL válida (ej. https://tuempresa.com)' }],
    nombre:        [{ rule: 'required', message: 'Tu nombre es requerido' },
                    { rule: 'maxLength', value: 120 }],
    email:         [{ rule: 'required' }, { rule: 'email' }],
    password:      [{ rule: 'required' }, { rule: 'password' }],
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    FormValidator.clearErrors(form);

    const { valid } = FormValidator.validate(form, RULES, alertEl);
    if (!valid) return;

    btn.disabled    = true;
    btn.textContent = 'Registrando empresa...';

    try {
      await apiFetch('/auth/registro/empresa', {
        method: 'POST',
        body: JSON.stringify({
          email:         form.elements.email.value.trim(),
          password:      form.elements.password.value,
          nombre:        form.elements.nombre.value.trim(),
          empresaNombre: form.elements.empresaNombre.value.trim(),
          industria:     form.elements.industria.value,
          ubicacion:     form.elements.ubicacion.value,
          sitioWeb:      form.elements.sitioWeb?.value.trim() || null,
        }),
      });
      window.location.href = '/pages/registro-exitoso-empresa.html';
    } catch (err) {
      if (err.data?.details) {
        FormValidator.showApiErrors(form, err.data.details, alertEl);
      } else {
        showError(err.message ?? 'Error al registrar empresa. Intenta de nuevo.');
      }
      btn.disabled    = false;
      btn.textContent = 'Registrar empresa';
    }
  });
});
