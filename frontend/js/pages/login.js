// frontend/js/pages/login.js
import { login, getUser, redirectByRole } from '/js/auth.js';

// Si ya hay sesión activa, redirigir de inmediato
const existing = getUser();
if (existing) redirectByRole(existing.role);

const qs = new URLSearchParams(location.search);

// Pre-seleccionar tab según ?type= y capturar ?redirect=
let loginType   = qs.get('type') === 'empresa' ? 'empresa' : qs.get('type') === 'admin' ? 'admin' : 'candidato';
const redirectTo = qs.get('redirect') || null;

const alertEl = document.getElementById('alertEl');
const btn     = document.getElementById('btnSubmit');

// ── Tabs ─────────────────────────────────────────────────────────────
const setTab = (t) => {
  loginType = t;
  document.querySelectorAll('#loginTabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.type === t));
  hideError();
};
setTab(loginType);

document.getElementById('loginTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]');
  if (b) setTab(b.dataset.type);
});

// ── Alert ─────────────────────────────────────────────────────────────
const showError = (m) => { alertEl.textContent = m; alertEl.classList.add('visible'); };
const hideError = ()  => { alertEl.classList.remove('visible'); };

// ── Submit ────────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    const user = await login(
      document.getElementById('email').value.trim(),
      document.getElementById('password').value,
      loginType,
    );

    // Smart redirect: si venía de una vacante u otra página protegida, volver ahí
    if (redirectTo) {
      window.location.href = decodeURIComponent(redirectTo);
    } else {
      redirectByRole(user.role);
    }
  } catch (err) {
    showError(err.message ?? 'Credenciales incorrectas. Intenta de nuevo.');
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión';
  }
});
