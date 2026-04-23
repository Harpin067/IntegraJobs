// Dashboard shell (sidebar + mobile topbar) for candidato / empresa / admin.
import { requireAuth, logout } from '/js/auth.js';
import { renderIcon } from '/js/icons.js';
import { initials, escapeHtml } from '/js/helpers.js';

const NAV = {
  CANDIDATO: {
    brand: 'Portal Candidato',
    theme: '',
    links: [
      { href: '/pages/candidato/dashboard.html', label: 'Dashboard',   icon: 'dashboard' },
      { href: '/pages/candidato/busqueda.html',  label: 'Búsqueda',    icon: 'search' },
      { href: '/pages/candidato/perfil.html',    label: 'Mi Perfil',   icon: 'user' },
      { href: '/pages/candidato/alertas.html',   label: 'Alertas',     icon: 'bell' },
      { href: '/pages/candidato/valoraciones.html', label: 'Valoraciones', icon: 'star' },
    ],
  },
  EMPRESA: {
    brand: 'Portal Empresa',
    theme: '',
    links: [
      { href: '/pages/empresa/dashboard.html',      label: 'Dashboard',    icon: 'dashboard' },
      { href: '/pages/empresa/vacantes.html',       label: 'Mis vacantes', icon: 'briefcase' },
      { href: '/pages/empresa/crear-vacante.html',  label: 'Publicar',     icon: 'plusCircle' },
      { href: '/pages/empresa/perfil.html',         label: 'Perfil',       icon: 'building' },
    ],
  },
  SUPERADMIN: {
    brand: 'IntegraJobs Admin',
    brandSub: 'Admin · El Salvador',
    theme: 'admin',
    links: [
      { href: '/pages/admin/dashboard.html', label: 'Dashboard', icon: 'dashboard' },
      { href: '/pages/admin/usuarios.html',  label: 'Usuarios',  icon: 'users' },
      { href: '/pages/admin/dashboard.html#empresas', label: 'Empresas',  icon: 'building' },
      { href: '/pages/admin/dashboard.html#vacantes', label: 'Vacantes',  icon: 'briefcase' },
    ],
  },
};

export function mountShell(expectedRole) {
  const user = requireAuth();
  if (!user) return null;
  if (expectedRole && user.role !== expectedRole) {
    window.location.href = '/pages/login.html';
    return null;
  }
  const cfg = NAV[user.role] ?? NAV.CANDIDATO;
  const current = window.location.pathname;
  const displayName = [user.nombre, user.apellidos].filter(Boolean).join(' ')
    || user.name || user.email.split('@')[0];
  const email = user.email ?? '';

  const navItems = cfg.links.map(l => {
    const active = current.startsWith(l.href.split('#')[0]);
    return `<a href="${l.href}" class="${active ? 'active' : ''}" title="${l.label}">
      ${renderIcon(l.icon)}<span>${l.label}</span>
    </a>`;
  }).join('');

  const sidebarHtml = `
    <aside class="ij-sidebar ${cfg.theme}" id="ij-sidebar">
      <div class="ij-sb-header">
        <a href="/" class="ij-brand">
          <span class="ij-brand-icon">${renderIcon('briefcase')}</span>
          <span class="ij-brand-text">
            <span class="ij-brand-name">${cfg.brand}</span>
            ${cfg.brandSub ? `<span class="ij-brand-sub" style="display:block">${cfg.brandSub}</span>` : ''}
          </span>
        </a>
        <button class="ij-sb-toggle" id="ij-sb-toggle" aria-label="Colapsar">${renderIcon('chevronL')}</button>
      </div>
      <nav class="ij-nav">${navItems}</nav>
      <div class="ij-sb-sep"></div>
      <div class="ij-userbox">
        <div class="ij-avatar">${initials(displayName)}</div>
        <div class="meta">
          <div class="name">${escapeHtml(displayName)}</div>
          <div class="email">${escapeHtml(email)}</div>
        </div>
        <button class="ij-logout" id="ij-logout" title="Salir">${renderIcon('logout')}</button>
      </div>
    </aside>
    <div class="ij-drawer-backdrop" id="ij-drawer-backdrop"></div>
  `;

  const mobileBarHtml = `
    <header class="ij-mobile-bar">
      <a href="/" class="ij-brand">
        <span class="ij-brand-icon">${renderIcon('briefcase')}</span>
        <span class="ij-brand-name">${cfg.brand}</span>
      </a>
      <button class="ij-mobile-menu-btn" id="ij-mobile-menu" aria-label="Menú">${renderIcon('menu')}</button>
    </header>
  `;

  const root = document.getElementById('ij-app') || document.body;
  root.classList.add('ij-app');
  const main = document.getElementById('ij-main') || (() => {
    // If markup already contains <main id="ij-main">, use it; else wrap
    const el = document.createElement('div');
    el.id = 'ij-main'; el.className = 'ij-main';
    while (root.firstChild) el.appendChild(root.firstChild);
    root.appendChild(el);
    return el;
  })();
  main.className = 'ij-main';
  root.insertAdjacentHTML('afterbegin', sidebarHtml);
  main.insertAdjacentHTML('afterbegin', mobileBarHtml);

  // Handlers
  document.getElementById('ij-logout').addEventListener('click', logout);
  document.getElementById('ij-sb-toggle').addEventListener('click', () => {
    document.getElementById('ij-sidebar').classList.toggle('collapsed');
  });
  const sidebar = document.getElementById('ij-sidebar');
  const backdrop = document.getElementById('ij-drawer-backdrop');
  document.getElementById('ij-mobile-menu').addEventListener('click', () => {
    sidebar.classList.add('open'); backdrop.classList.add('open');
  });
  backdrop.addEventListener('click', () => {
    sidebar.classList.remove('open'); backdrop.classList.remove('open');
  });

  return user;
}

export function contentWrap() {
  // Returns the element where page content should be rendered.
  const main = document.getElementById('ij-main');
  let content = main.querySelector('.ij-content');
  if (!content) {
    content = document.createElement('div');
    content.className = 'ij-content';
    main.appendChild(content);
  }
  return content;
}
