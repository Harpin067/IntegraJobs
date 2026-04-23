import { apiFetch } from "../../api.js";
import { requireAuth } from "../../auth.js";

requireAuth();

document.getElementById('vacanteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const salarioMinRaw = document.getElementById('salarioMin').value.trim();
    const salarioMaxRaw = document.getElementById('salarioMax').value.trim();

    const data = {
        titulo:       document.getElementById('titulo').value,
        descripcion:  document.getElementById('descripcion').value,
        requisitos:   document.getElementById('requisitos').value,
        ubicacion:    document.getElementById('ubicacion').value,
        tipoTrabajo:  document.getElementById('tipoTrabajo').value,
        tipoContrato: document.getElementById('tipoContrato').value,
        experiencia:  document.getElementById('experiencia').value,
        contacto:     document.getElementById('contacto').value,
        ...(salarioMinRaw && { salarioMin: salarioMinRaw }),
        ...(salarioMaxRaw && { salarioMax: salarioMaxRaw }),
    };

    const msg = document.getElementById('msg');

    try {
        await apiFetch('/empresa/vacantes', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        msg.className = 'small fw-semibold text-success';
        msg.innerText = 'Vacante publicada. Pendiente de aprobación por un administrador.';
        e.target.reset();

    } catch (error) {
        msg.className = 'small fw-semibold text-danger';
        msg.innerText = error.message;
    }
});
