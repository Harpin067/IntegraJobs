import { apiFetch } from "../../api.js";

const token = localStorage.getItem('token');
if (!token) window.location.href = '/pages/login.html';

document.addEventListener('DOMContentLoaded', async () => {
    await cargarPerfil();
    document.getElementById('perfilForm').addEventListener('submit', actualizarPerfil);
    document.getElementById('logoForm').addEventListener('submit', subirLogo);
});

async function cargarPerfil() {
    try {
        const perfil = await apiFetch('/empresa/perfil');

        document.getElementById('nombre').value      = perfil.nombre      || '';
        document.getElementById('industria').value   = perfil.industria   || '';
        document.getElementById('ubicacion').value   = perfil.ubicacion   || '';
        document.getElementById('sitioWeb').value    = perfil.sitio_web   || '';
        document.getElementById('descripcion').value = perfil.descripcion || '';

        // Mostrar nombre de la empresa en el encabezado
        const nombreEl = document.getElementById('empresaNombre');
        if (nombreEl && perfil.nombre) nombreEl.textContent = perfil.nombre;

        // Mostrar logo si existe
        if (perfil.logo_url) {
            const img    = document.getElementById('currentLogo');
            img.src      = perfil.logo_url;
            img.style.display = 'block';
        }
    } catch (err) {
        alert(err.message);
    }
}

async function actualizarPerfil(e) {
    e.preventDefault();
    const msg = document.getElementById('perfilMessage');

    const body = {
        nombre:      document.getElementById('nombre').value,
        industria:   document.getElementById('industria').value,
        ubicacion:   document.getElementById('ubicacion').value,
        sitioWeb:    document.getElementById('sitioWeb').value,
        descripcion: document.getElementById('descripcion').value,
    };

    try {
        await apiFetch('/empresa/perfil', { method: 'PUT', body: JSON.stringify(body) });
        msg.className = 'small fw-semibold text-success';
        msg.innerText = 'Perfil actualizado correctamente';

        // Actualizar nombre en el encabezado también
        const nombreEl = document.getElementById('empresaNombre');
        if (nombreEl && body.nombre) nombreEl.textContent = body.nombre;
    } catch (err) {
        msg.className = 'small fw-semibold text-danger';
        msg.innerText = err.message;
    }
}

async function subirLogo(e) {
    e.preventDefault();
    const msg  = document.getElementById('logoMessage');
    const file = document.getElementById('logoInput').files[0];

    if (!file) { alert('Selecciona un archivo'); return; }

    const formData = new FormData();
    formData.append('logo', file);

    try {
        const res  = await fetch('/api/empresa/perfil/logo', {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
            body:    formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const img    = document.getElementById('currentLogo');
        img.src      = data.logo_url;
        img.style.display = 'block';

        msg.className = 'small fw-semibold text-success';
        msg.innerText = 'Logo actualizado correctamente';
    } catch (err) {
        msg.className = 'small fw-semibold text-danger';
        msg.innerText = err.message;
    }
}
