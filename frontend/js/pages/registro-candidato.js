import { apiFetch } from '/js/api.js';
import { redirectByRole } from '/js/auth.js';

const alertEl = document.getElementById('alert');
const okEl    = document.getElementById('success');
const btn     = document.getElementById('btnSubmit');

const showError = (m) => { alertEl.textContent = m; alertEl.classList.remove('ij-hidden'); okEl.classList.add('ij-hidden'); };

document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('ij-hidden');
  btn.disabled = true; btn.textContent = 'Creando cuenta...';
  try {
    const data = await apiFetch('/auth/registro/candidato', {
      method: 'POST',
      body: JSON.stringify({
        email:     document.getElementById('email').value.trim(),
        password:  document.getElementById('password').value,
        nombre:    document.getElementById('nombre').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
      }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    redirectByRole(data.user.role);
  } catch (err) {
    showError(err.message ?? 'Error al registrarse');
    btn.disabled = false; btn.textContent = 'Crear cuenta';
  }
});
