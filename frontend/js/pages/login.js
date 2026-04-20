// frontend/js/pages/login.js
import { login, getUser, redirectByRole } from '/js/auth.js';

// Si ya hay sesión activa, redirigir de inmediato
const existing = getUser();
if (existing) redirectByRole(existing.role);

const qs         = new URLSearchParams(location.search);
const redirectTo = qs.get('redirect') || null;

// Estado del rol seleccionado (por defecto según ?type=)
let attemptedRole = qs.get('type') === 'empresa' ? 'EMPRESA' : 'CANDIDATO';

// ── Copy dinámico por rol ─────────────────────────────────────────────
const brandCopy = {
  CANDIDATO: {
    tag:     '✦ Para Candidatos',
    heading: 'Tu próxima oportunidad<br>te está esperando',
    sub:     'Accede a miles de vacantes reales, crea alertas personalizadas y postula con un solo clic.',
  },
  EMPRESA: {
    tag:     '✦ Para Empresas',
    heading: 'El mejor talento<br>está aquí',
    sub:     'Publica tus vacantes, gestiona postulaciones y construye el equipo que tu empresa necesita.',
  },
};

const brandTag     = document.getElementById('brandTag');
const brandHeading = document.getElementById('brandHeading');
const brandSub     = document.getElementById('brandSub');
const alertEl      = document.getElementById('alertEl');
const btn          = document.getElementById('btnSubmit');

// ── Segmented control ─────────────────────────────────────────────────
const setRole = (role) => {
  attemptedRole = role;

  document.querySelectorAll('#segControl button').forEach(b =>
    b.classList.toggle('active', b.dataset.role === role));

  const copy = brandCopy[role];
  brandTag.textContent    = copy.tag;
  brandHeading.innerHTML  = copy.heading;
  brandSub.textContent    = copy.sub;
  hideError();
};

setRole(attemptedRole);

document.getElementById('segControl').addEventListener('click', (e) => {
  const b = e.target.closest('[data-role]');
  if (b) setRole(b.dataset.role);
});

// ── Alert ─────────────────────────────────────────────────────────────
const showError = (m) => { alertEl.textContent = m; alertEl.classList.add('show'); };
const hideError = ()  => { alertEl.classList.remove('show'); };

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
      attemptedRole,          // 'CANDIDATO' | 'EMPRESA'  → backend lo valida
    );

    // Smart redirect: volver a la página de origen (ej. vacante) o ir al dashboard
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
