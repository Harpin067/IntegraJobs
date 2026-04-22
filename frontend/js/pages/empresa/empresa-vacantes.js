const token = localStorage.getItem('token');
if (!token) window.location.href = '/pages/login.html';

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

let vacancyEnEdicion = null;
let vacantesCache    = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarVacantes();
    document.getElementById('vacantesList').addEventListener('click', manejarClickVacante);
    document.getElementById('editForm').addEventListener('submit', guardarEdicion);
    document.getElementById('cancelEdit').addEventListener('click', cerrarEdicion);
});

/* ─── LISTAR VACANTES ────────────────────────────────────── */

async function cargarVacantes() {
    try {
        const res = await fetch('/api/empresa/vacantes', { headers });
        vacantesCache = await res.json();

        const container = document.getElementById('vacantesList');
        container.innerHTML = '';

        if (!vacantesCache.length) {
            container.innerHTML = '<p>No has publicado vacantes aún.</p>';
            return;
        }

        vacantesCache.forEach(v => {
            const badgeClass = `badge-${v.status}`;
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <h3>${v.titulo}</h3>
                <p style="color:#6b7280;font-size:0.85rem">${v.ubicacion} · ${v.tipo_trabajo}</p>
                <span class="badge ${badgeClass}">${v.status}</span>
                <p style="font-size:0.85rem">
                    👥 ${v.total_postulaciones} postulantes &nbsp;·&nbsp;
                    🔄 ${v.en_proceso} en proceso &nbsp;·&nbsp;
                    ✅ ${v.contratados} contratados
                </p>
                <div class="actions">
                    <button class="btn-sm btn-candidatos" data-action="candidatos" data-id="${v.id}" data-titulo="${encodeURIComponent(v.titulo)}">Ver Candidatos</button>
                    <button class="btn-sm btn-editar"     data-action="editar"     data-id="${v.id}">Editar</button>
                    ${v.status === 'activa'
                        ? `<button class="btn-sm btn-pausar"  data-action="status" data-id="${v.id}" data-status="pausada">Pausar</button>`
                        : v.status === 'pausada'
                            ? `<button class="btn-sm btn-activar" data-action="status" data-id="${v.id}" data-status="activa">Activar</button>`
                            : ''
                    }
                    ${v.status !== 'cerrada'
                        ? `<button class="btn-sm btn-cerrar" data-action="status" data-id="${v.id}" data-status="cerrada">Cerrar</button>`
                        : ''
                    }
                </div>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error('Error cargando vacantes:', err);
    }
}

function manejarClickVacante(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const { action, id, titulo, status } = btn.dataset;

    if (action === 'candidatos') cargarATS(id, decodeURIComponent(titulo));
    if (action === 'editar')     abrirEdicion(id);
    if (action === 'status')     cambiarEstado(id, status);
}

/* ─── VER CANDIDATOS ─────────────────────────────────────── */

async function cargarATS(vacancyId, titulo) {
    cerrarEdicion();
    document.getElementById('atsTitle').innerText = `Candidatos: ${titulo}`;
    const container = document.getElementById('aplicantesContainer');
    container.innerHTML = 'Cargando...';

    try {
        const res = await fetch(`/api/empresa/vacantes/${vacancyId}/aplicaciones`, { headers });
        const aplicaciones = await res.json();

        if (!aplicaciones.length) {
            container.innerHTML = '<p>Aún no hay candidatos para esta vacante.</p>';
            return;
        }

        container.innerHTML = '';
        aplicaciones.forEach(app => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <h4 style="margin:0 0 4px">${app.nombre} ${app.apellidos}</h4>
                <p style="margin:2px 0;font-size:0.85rem">
                    <a href="mailto:${app.email}">${app.email}</a>
                </p>
                <p style="margin:2px 0;font-size:0.85rem">Teléfono: ${app.telefono || 'N/A'}</p>
                ${app.cv_url
                    ? `<a href="${app.cv_url}" target="_blank" class="cv-link">📄 Ver CV</a>`
                    : `<span class="sin-cv">Sin CV adjunto</span>`
                }
                <div style="margin-top:10px">
                    <label style="font-size:0.85rem;font-weight:600">Estado:</label>
                    <select class="status-select" data-app-id="${app.aplicacion_id}">
                        <option value="nuevo"      ${app.status === 'nuevo'      ? 'selected' : ''}>Nuevo</option>
                        <option value="en_proceso" ${app.status === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="contratado" ${app.status === 'contratado' ? 'selected' : ''}>Contratado</option>
                        <option value="rechazado"  ${app.status === 'rechazado'  ? 'selected' : ''}>Rechazado</option>
                    </select>
                </div>
            `;
            container.appendChild(div);
        });

        container.addEventListener('change', async e => {
            const sel = e.target.closest('select[data-app-id]');
            if (!sel) return;
            await cambiarStatusCandidato(sel.dataset.appId, sel.value);
        });
    } catch (err) {
        container.innerHTML = '<p style="color:red">Error al cargar candidatos.</p>';
    }
}

async function cambiarStatusCandidato(appId, nuevoStatus) {
    const res = await fetch(`/api/empresa/aplicaciones/${appId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nuevoStatus })
    });
    if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error al actualizar el estado');
    }
}

/* ─── CAMBIAR ESTADO DE VACANTE ──────────────────────────── */

async function cambiarEstado(vacancyId, nuevoStatus) {
    const res = await fetch(`/api/empresa/vacantes/${vacancyId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: nuevoStatus })
    });
    if (res.ok) {
        cargarVacantes();
    } else {
        const err = await res.json();
        alert(err.error || 'Error al cambiar el estado');
    }
}

/* ─── EDICIÓN INLINE ─────────────────────────────────────── */

function abrirEdicion(vacancyId) {
    const v = vacantesCache.find(x => x.id === vacancyId);
    if (!v) return;
    vacancyEnEdicion = v;

    document.getElementById('e_titulo').value       = v.titulo        || '';
    document.getElementById('e_ubicacion').value    = v.ubicacion     || '';
    document.getElementById('e_descripcion').value  = v.descripcion   || '';
    document.getElementById('e_requisitos').value   = v.requisitos    || '';
    document.getElementById('e_tipoTrabajo').value  = v.tipo_trabajo  || 'remoto';
    document.getElementById('e_tipoContrato').value = v.tipo_contrato || 'completo';
    document.getElementById('e_experiencia').value  = v.experiencia   || 'junior';
    document.getElementById('e_contacto').value     = v.contacto      || '';
    document.getElementById('e_salarioMin').value   = v.salario_min   || '';
    document.getElementById('e_salarioMax').value   = v.salario_max   || '';
    document.getElementById('editMsg').innerText    = '';

    document.getElementById('candidatosPanel').style.display = 'none';
    document.getElementById('editPanel').style.display       = 'block';
}

function cerrarEdicion() {
    vacancyEnEdicion = null;
    document.getElementById('editPanel').style.display       = 'none';
    document.getElementById('candidatosPanel').style.display = 'block';
}

async function guardarEdicion(e) {
    e.preventDefault();
    if (!vacancyEnEdicion) return;

    const msg = document.getElementById('editMsg');
    const salMin = document.getElementById('e_salarioMin').value.trim();
    const salMax = document.getElementById('e_salarioMax').value.trim();

    const body = {
        titulo:       document.getElementById('e_titulo').value,
        ubicacion:    document.getElementById('e_ubicacion').value,
        descripcion:  document.getElementById('e_descripcion').value,
        requisitos:   document.getElementById('e_requisitos').value,
        tipoTrabajo:  document.getElementById('e_tipoTrabajo').value,
        tipoContrato: document.getElementById('e_tipoContrato').value,
        experiencia:  document.getElementById('e_experiencia').value,
        contacto:     document.getElementById('e_contacto').value,
        ...(salMin && { salarioMin: salMin }),
        ...(salMax && { salarioMax: salMax }),
    };

    const res = await fetch(`/api/empresa/vacantes/${vacancyEnEdicion.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });

    if (res.ok) {
        msg.style.color = '#16a34a';
        msg.innerText = '✅ Vacante actualizada';
        setTimeout(() => { cerrarEdicion(); cargarVacantes(); }, 900);
    } else {
        const err = await res.json();
        msg.style.color = '#dc2626';
        msg.innerText = `❌ ${err.error || 'Error al actualizar'}`;
    }
}
