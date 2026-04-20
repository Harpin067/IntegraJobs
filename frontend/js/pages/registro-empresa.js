// frontend/js/pages/registro-empresa.js
import { apiFetch } from '/js/api.js';

document.addEventListener('DOMContentLoaded', () => {
  const alertEl = document.getElementById('alertEl');
  const btn     = document.getElementById('btn-submit');

  const showError = (m) => { alertEl.textContent = m; alertEl.classList.add('show'); };
  const hideError = ()  => { alertEl.classList.remove('show'); };

  document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    btn.disabled    = true;
    btn.textContent = 'Registrando empresa...';

    try {
      await apiFetch('/auth/registro/empresa', {
        method: 'POST',
        body: JSON.stringify({
          email:         document.getElementById('email').value.trim(),
          password:      document.getElementById('password').value,
          nombre:        document.getElementById('nombre').value.trim(),
          empresaNombre: document.getElementById('empresaNombre').value.trim(),
          industria:     document.getElementById('industria').value,
          ubicacion:     document.getElementById('ubicacion').value,
          sitioWeb:      document.getElementById('sitioWeb').value.trim() || null,
        }),
      });
      window.location.href = '/pages/registro-exitoso-empresa.html';
    } catch (err) {
      showError(err.message ?? 'Error al registrar empresa. Intenta de nuevo.');
      btn.disabled    = false;
      btn.textContent = 'Registrar empresa';
    }
  });
});
