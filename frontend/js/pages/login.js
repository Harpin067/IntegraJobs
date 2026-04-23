// frontend/js/pages/login.js
import { login, getUser, redirectByRole } from '/js/auth.js';

// Si ya hay sesión activa, redirigir de inmediato
const existing = getUser();
if (existing) redirectByRole(existing.role);

const qs         = new URLSearchParams(location.search);
const redirectTo = qs.get('redirect') || null;

document.addEventListener('DOMContentLoaded', () => {

  // ── Refs ────────────────────────────────────────────────────────────
  const tabCandidato = document.getElementById('tab-candidato');
  const tabEmpresa   = document.getElementById('tab-empresa');
  const roleInput    = document.getElementById('roleInput');
  const btnSubmit    = document.getElementById('btn-submit');
  const brandTag     = document.getElementById('brandTag');
  const brandHeading = document.getElementById('brandHeading');
  const brandSub     = document.getElementById('brandSub');
  const alertEl      = document.getElementById('alertEl');

  // ── Copy dinámico por rol ──────────────────────────────────────────
  const brandCopy = {
    CANDIDATO: {
      tag:     'Para Candidatos',
      heading: 'Tu próxima oportunidad<br>te está esperando',
      sub:     'Accede a miles de vacantes reales, crea alertas personalizadas y postula con un solo clic.',
    },
    EMPRESA: {
      tag:     'Para Empresas',
      heading: 'El mejor talento<br>está aquí',
      sub:     'Publica tus vacantes, gestiona postulaciones y construye el equipo que tu empresa necesita.',
    },
  };

  // ── Alert ──────────────────────────────────────────────────────────
  const showError = (m) => { alertEl.textContent = m; alertEl.classList.add('show'); };
  const hideError = ()  => { alertEl.classList.remove('show'); };

  // ── setRole: tema azul (CANDIDATO) o verde (EMPRESA) ──────────────
  const COLORS = {
    CANDIDATO: { primary: '#1A56DB', shadow: 'rgba(26,86,219,.35)' },
    EMPRESA:   { primary: '#10B981', shadow: 'rgba(16,185,129,.35)' },
  };

  let currentRole = qs.get('type') === 'empresa' ? 'EMPRESA' : 'CANDIDATO';

  const setRole = (role) => {
    console.log('Tab clickeado:', role);
    currentRole        = role;
    roleInput.value    = role;

    const color = COLORS[role];

    // Tabs
    tabCandidato.style.background  = role === 'CANDIDATO' ? '#fff' : 'transparent';
    tabCandidato.style.color       = role === 'CANDIDATO' ? '#1A56DB' : 'var(--color-muted)';
    tabCandidato.style.fontWeight  = role === 'CANDIDATO' ? '700' : '500';
    tabCandidato.style.boxShadow   = role === 'CANDIDATO' ? '0 1px 4px rgba(15,23,42,.1)' : 'none';

    tabEmpresa.style.background    = role === 'EMPRESA' ? '#fff' : 'transparent';
    tabEmpresa.style.color         = role === 'EMPRESA' ? '#10B981' : 'var(--color-muted)';
    tabEmpresa.style.fontWeight    = role === 'EMPRESA' ? '700' : '500';
    tabEmpresa.style.boxShadow     = role === 'EMPRESA' ? '0 1px 4px rgba(15,23,42,.1)' : 'none';

    // Botón submit
    btnSubmit.style.background = color.primary;
    btnSubmit.style.boxShadow  = `0 4px 16px ${color.shadow}`;

    // Copy panel izquierdo
    const copy = brandCopy[role];
    brandTag.textContent   = copy.tag;
    brandHeading.innerHTML = copy.heading;
    brandSub.textContent   = copy.sub;

    hideError();
  };

  // Inicializar
  setRole(currentRole);

  // ── Listeners directos ─────────────────────────────────────────────
  tabCandidato.addEventListener('click', () => setRole('CANDIDATO'));
  tabEmpresa.addEventListener('click',   () => setRole('EMPRESA'));

  // ── Submit ─────────────────────────────────────────────────────────
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    btnSubmit.disabled    = true;
    btnSubmit.textContent = 'Entrando...';

    try {
      const user = await login(
        document.getElementById('email').value.trim(),
        document.getElementById('password').value,
        currentRole,
      );

      if (redirectTo) {
        window.location.href = decodeURIComponent(redirectTo);
      } else {
        redirectByRole(user.role);
      }
    } catch (err) {
      showError(err.message ?? 'Credenciales incorrectas. Intenta de nuevo.');
      btnSubmit.disabled    = false;
      btnSubmit.textContent = 'Iniciar sesión';
    }
  });

});
