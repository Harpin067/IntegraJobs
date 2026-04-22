import { apiFetch } from "../../api.js";

const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/pages/login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    await cargarPerfil();

    document
        .getElementById('perfilForm')
        .addEventListener('submit', actualizarPerfil);

    document
        .getElementById('logoForm')
        .addEventListener('submit', subirLogo);
});

/* =========================
   PERFIL
========================= */
async function cargarPerfil() {
    try {
        const perfil = await apiFetch('/empresa/perfil');

        document.getElementById('nombre').value = perfil.nombre || '';
        document.getElementById('industria').value = perfil.industria || '';
        document.getElementById('ubicacion').value = perfil.ubicacion || '';
        document.getElementById('sitioWeb').value = perfil.sitio_web || '';
        document.getElementById('descripcion').value = perfil.descripcion || '';

        if (perfil.logo_url) {
            const img = document.getElementById('currentLogo');
            img.src = perfil.logo_url;
            img.style.display = 'block';
        }

    } catch (err) {
        alert(err.message);
    }
}

/* =========================
   UPDATE PERFIL
========================= */
async function actualizarPerfil(e) {
    e.preventDefault();

    const msg = document.getElementById('perfilMessage');

    const body = {
        nombre:      document.getElementById('nombre').value,
        industria:   document.getElementById('industria').value,
        ubicacion:   document.getElementById('ubicacion').value,
        sitioWeb:    document.getElementById('sitioWeb').value,
        descripcion: document.getElementById('descripcion').value
    };

    try {
        await apiFetch('/empresa/perfil', {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        msg.style.color = '#16a34a';
        msg.innerText = '✅ Perfil actualizado correctamente';
    } catch (err) {
        msg.style.color = '#dc2626';
        msg.innerText = `❌ ${err.message}`;
    }
}

/* =========================
   LOGO
========================= */
async function subirLogo(e) {
    e.preventDefault();

    const file = document.getElementById('logoInput').files[0];

    if (!file) return alert('Selecciona un archivo');

    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch('/api/empresa/perfil/logo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    document.getElementById('currentLogo').src = data.logo_url;
    document.getElementById('logoMessage').innerText = 'Logo actualizado';
}
