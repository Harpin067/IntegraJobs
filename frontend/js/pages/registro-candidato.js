// frontend/js/pages/registro-candidato.js
import { apiFetch } from '/js/api.js';
import { redirectByRole } from '/js/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const alertEl = document.getElementById('alertEl');
  const btn     = document.getElementById('btn-submit');

  const showError = (m) => { alertEl.textContent = m; alertEl.classList.add('show'); };
  const hideError = ()  => { alertEl.classList.remove('show'); };

  document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden. Verifica e intenta de nuevo.');
      return;
    }
    if (password.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Creando cuenta...';

    try {
      const data = await apiFetch('/auth/registro/candidato', {
        method: 'POST',
        body: JSON.stringify({
          email:     document.getElementById('email').value.trim(),
          password,
          nombre:    document.getElementById('nombre').value.trim(),
          apellidos: document.getElementById('apellidos').value.trim(),
        }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      redirectByRole(data.user.role);
    } catch (err) {
      showError(err.message ?? 'Error al registrarse. Intenta de nuevo.');
      btn.disabled    = false;
      btn.textContent = 'Crear cuenta gratis';
    }
  });
});
