import { apiFetch } from '/js/api.js';
import { requireAuth } from '/js/auth.js';

requireAuth();

const success = document.getElementById('successMsg');
const error   = document.getElementById('errorMsg');

// Escape básico para evitar XSS al renderizar datos del servidor
function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function flash(el, msg) {
    el.textContent = msg;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 3500);
}

function starsHtml(rating) {
    return [1, 2, 3, 4, 5].map(n =>
        `<span style="color:${n <= rating ? '#f59e0b' : '#dee2e6'};font-size:1rem">★</span>`
    ).join('');
}

// Cargar empresas de postulaciones para el select
async function cargarEmpresas() {
    try {
        const posts  = await apiFetch('/candidato/postulaciones');
        const select = document.getElementById('reviewCompany');
        const vistas = new Set();
        const opts   = posts
            .filter(p => { if (vistas.has(p.empresa_id)) return false; vistas.add(p.empresa_id); return true; })
            .map(p => `<option value="${p.empresa_id}">${esc(p.empresa_nombre)}</option>`);
        select.innerHTML = opts.length
            ? `<option value="">-- Selecciona una empresa --</option>${opts.join('')}`
            : `<option value="">No tienes postulaciones aún</option>`;
    } catch {
        document.getElementById('reviewCompany').innerHTML = '<option value="">Error al cargar</option>';
    }
}

// Cargar mis valoraciones enviadas
async function cargarMisReviews() {
    const container = document.getElementById('myReviews');
    try {
        const reviews = await apiFetch('/candidato/reviews');
        if (!reviews.length) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-star fs-1 d-block mb-2 opacity-25"></i>
                    <div class="small">Aún no has valorado ninguna empresa.</div>
                </div>`;
            return;
        }
        container.innerHTML = reviews.map(r => `
            <div class="py-3 border-bottom">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="fw-semibold small">${esc(r.empresa_nombre)}</span>
                    <div>${starsHtml(r.rating)}</div>
                </div>
                <div class="small text-secondary">${esc(r.comentario)}</div>
                <div class="mt-1" style="font-size:.75rem;color:#6b7280">
                    ${r.is_approved
                        ? '<i class="bi bi-check-circle text-success me-1"></i>Aprobada y visible'
                        : '<i class="bi bi-clock text-warning me-1"></i>Pendiente de aprobación'}
                </div>
            </div>`
        ).join('');
    } catch {
        container.innerHTML = '<div class="alert alert-danger small">Error al cargar valoraciones.</div>';
    }
}

// Star rating interactivo
let selectedRating = 0;

document.getElementById('starRating').addEventListener('mouseover', (e) => {
    const star = e.target.closest('[data-star]');
    if (!star) return;
    const n = Number(star.dataset.star);
    document.querySelectorAll('.star-btn').forEach((b, i) => {
        b.style.color = i < n ? '#f59e0b' : '#dee2e6';
    });
});

document.getElementById('starRating').addEventListener('mouseleave', () => {
    document.querySelectorAll('.star-btn').forEach((b, i) => {
        b.style.color = i < selectedRating ? '#f59e0b' : '#dee2e6';
    });
});

document.getElementById('starRating').addEventListener('click', (e) => {
    const star = e.target.closest('[data-star]');
    if (!star) return;
    selectedRating = Number(star.dataset.star);
    document.getElementById('reviewRating').value = selectedRating;
    document.querySelectorAll('.star-btn').forEach((b, i) => {
        b.style.color = i < selectedRating ? '#f59e0b' : '#dee2e6';
    });
});

// Enviar valoración
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyId  = document.getElementById('reviewCompany').value;
    const rating     = Number(document.getElementById('reviewRating').value);
    const comentario = document.getElementById('reviewComentario').value.trim();

    if (!companyId)  { flash(error, 'Selecciona una empresa.'); return; }
    if (!rating)     { flash(error, 'Selecciona una calificación.'); return; }
    if (!comentario) { flash(error, 'Escribe un comentario.'); return; }

    try {
        await apiFetch(`/candidato/reviews/${companyId}`, {
            method: 'POST',
            body: JSON.stringify({ rating, comentario }),
        });
        flash(success, 'Valoración enviada. Será visible tras aprobación.');
        selectedRating = 0;
        document.querySelectorAll('.star-btn').forEach(b => b.style.color = '#dee2e6');
        document.getElementById('reviewRating').value    = '0';
        document.getElementById('reviewComentario').value = '';
        document.getElementById('reviewCompany').value   = '';
        cargarMisReviews();
    } catch (err) {
        flash(error, err.message ?? 'Error al enviar valoración.');
    }
});

cargarEmpresas();
cargarMisReviews();
