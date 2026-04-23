// frontend/js/pages/login.js
import { login, getUser, redirectByRole } from '/js/auth.js';
import { FormValidator } from '/js/form-validator.js';

const existing = getUser();
if (existing) redirectByRole(existing.role);

const qs         = new URLSearchParams(location.search);
const redirectTo = qs.get('redirect') || null;

document.addEventListener('DOMContentLoaded', () => {
  const tabCandidato = document.getElementById('tab-candidato');
  const tabEmpresa   = document.getElementById('tab-empresa');
  const roleInput    = document.getElementById('roleInput');
  const btnSubmit    = document.getElementById('btn-submit');
  const brandTag     = document.getElementById('brandTag');
  const brandHeading = document.getElementById('brandHeading');
  const brandSub     = document.getElementById('brandSub');
  const alertEl      = document.getElementById('alertEl');
  const form         = document.getElementById('loginForm');

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

  const COLORS = {
    CANDIDATO: { primary: '#1A56DB', shadow: 'rgba(26,86,219,.35)' },
    EMPRESA:   { primary: '#10B981', shadow: 'rgba(16,185,129,.35)' },
  };

  let currentRole = qs.get('type') === 'empresa' ? 'EMPRESA' : 'CANDIDATO';

  const showError = (m) => { alertEl.textContent = m; alertEl.classList.add('show'); };
  const hideError = ()  => { alertEl.classList.remove('show'); };

  const setRole = (role) => {
    currentRole     = role;
    roleInput.value = role;
    const color = COLORS[role];

    tabCandidato.style.background = role === 'CANDIDATO' ? '#fff' : 'transparent';
    tabCandidato.style.color      = role === 'CANDIDATO' ? '#1A56DB' : 'var(--color-muted)';
    tabCandidato.style.fontWeight = role === 'CANDIDATO' ? '700' : '500';
    tabCandidato.style.boxShadow  = role === 'CANDIDATO' ? '0 1px 4px rgba(15,23,42,.1)' : 'none';

    tabEmpresa.style.background   = role === 'EMPRESA' ? '#fff' : 'transparent';
    tabEmpresa.style.color        = role === 'EMPRESA' ? '#10B981' : 'var(--color-muted)';
    tabEmpresa.style.fontWeight   = role === 'EMPRESA' ? '700' : '500';
    tabEmpresa.style.boxShadow    = role === 'EMPRESA' ? '0 1px 4px rgba(15,23,42,.1)' : 'none';

    btnSubmit.style.background = color.primary;
    btnSubmit.style.boxShadow  = `0 4px 16px ${color.shadow}`;

    const copy = brandCopy[role];
    brandTag.textContent   = copy.tag;
    brandHeading.innerHTML = copy.heading;
    brandSub.textContent   = copy.sub;

    hideError();
    FormValidator.clearErrors(form);
  };

  setRole(currentRole);
  FormValidator.watchReset(form);

  tabCandidato.addEventListener('click', () => setRole('CANDIDATO'));
  tabEmpresa.addEventListener('click',   () => setRole('EMPRESA'));

  const RULES = {
    email:    [{ rule: 'required' }, { rule: 'email' }],
    password: [{ rule: 'required', message: 'Ingresa tu contraseña' }],
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const { valid } = FormValidator.validate(form, RULES, alertEl);
    if (!valid) return;

    btnSubmit.disabled    = true;
    btnSubmit.textContent = 'Entrando...';

    try {
      const user = await login(
        form.elements.email.value.trim(),
        form.elements.password.value,
        currentRole,
        document.getElementById('remember')?.checked ?? false,
      );
      if (redirectTo) {
        window.location.href = decodeURIComponent(redirectTo);
      } else {
        redirectByRole(user.role);
      }
    } catch (err) {
      if (err.data?.details) {
        FormValidator.showApiErrors(form, err.data.details, alertEl);
      } else {
        showError(err.message ?? 'Credenciales incorrectas. Intenta de nuevo.');
      }
      btnSubmit.disabled    = false;
      btnSubmit.textContent = 'Iniciar sesión';
    }
  });
});
