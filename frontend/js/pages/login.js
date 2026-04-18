import { login, getUser, redirectByRole } from '/js/auth.js';

const existing = getUser();
if (existing) redirectByRole(existing.role);

const qs = new URLSearchParams(location.search);
let loginType = qs.get('type') === 'empresa' ? 'empresa' : qs.get('type') === 'admin' ? 'admin' : 'candidato';

const alertEl = document.getElementById('alert');
const btn     = document.getElementById('btnSubmit');

const setTab = (t) => {
  loginType = t;
  document.querySelectorAll('#loginTabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.type === t));
  alertEl.classList.add('ij-hidden');
};
setTab(loginType);

document.getElementById('loginTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]');
  if (b) setTab(b.dataset.type);
});

const showError = (m) => { alertEl.textContent = m; alertEl.classList.remove('ij-hidden'); };

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('ij-hidden');
  btn.disabled = true; btn.textContent = 'Entrando...';
  try {
    const user = await login(
      document.getElementById('email').value.trim(),
      document.getElementById('password').value,
      loginType
    );
    redirectByRole(user.role);
  } catch (err) {
    showError(err.message ?? 'Error al iniciar sesión');
    btn.disabled = false; btn.textContent = 'Iniciar sesión';
  }
});
