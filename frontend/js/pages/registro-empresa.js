import { apiFetch } from '/js/api.js';

const alertEl = document.getElementById('alert');
const okEl    = document.getElementById('success');
const btn     = document.getElementById('btnSubmit');

const showError = (m) => { alertEl.textContent = m; alertEl.classList.remove('ij-hidden'); okEl.classList.add('ij-hidden'); };

document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('ij-hidden');
  btn.disabled = true; btn.textContent = 'Registrando...';
  try {
    await apiFetch('/auth/registro/empresa', {
      method: 'POST',
      body: JSON.stringify({
        email:         document.getElementById('email').value.trim(),
        password:      document.getElementById('password').value,
        nombre:        document.getElementById('nombre').value.trim(),
        empresaNombre: document.getElementById('empresaNombre').value.trim(),
        descripcion:   document.getElementById('descripcion').value.trim(),
        ubicacion:     document.getElementById('ubicacion').value.trim(),
        industria:     document.getElementById('industria').value.trim(),
      }),
    });
    okEl.innerHTML = 'Empresa registrada. Tu cuenta está pendiente de verificación por un administrador. <a href="/pages/login.html">Iniciar sesión</a>.';
    okEl.classList.remove('ij-hidden');
    document.getElementById('registroForm').style.display = 'none';
  } catch (err) {
    showError(err.message ?? 'Error al registrar empresa');
    btn.disabled = false; btn.textContent = 'Registrar empresa';
  }
});
