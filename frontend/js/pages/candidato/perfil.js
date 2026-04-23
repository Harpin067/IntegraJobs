import { apiFetch } from '/js/api.js';
import { requireAuth, logout } from '/js/auth.js';

requireAuth();

const $ = (id) => document.getElementById(id);

// Mostrar estado actual del CV
function renderCvStatus(cvUrl) {
    const container = $('cvStatus');
    if (!cvUrl) {
        container.innerHTML = `
            <div class="alert alert-warning d-flex align-items-center gap-2 py-2 mb-0">
                <i class="bi bi-exclamation-triangle fs-5"></i>
                <div>
                    <div class="fw-semibold small">Sin CV adjunto</div>
                    <div class="text-muted" style="font-size:.75rem">Las empresas no podrán ver tu currículum.</div>
                </div>
            </div>`;
        return;
    }
    const esArchivo = cvUrl.startsWith('/uploads/');
    const etiqueta  = esArchivo ? 'CV subido en IntegraJobs' : 'CV externo (URL)';
    container.innerHTML = `
        <div class="alert alert-success d-flex align-items-center justify-content-between gap-3 py-2 mb-0 flex-wrap">
            <div class="d-flex align-items-center gap-2">
                <i class="bi bi-file-earmark-check fs-5"></i>
                <div>
                    <div class="fw-semibold small">${etiqueta}</div>
                    <div class="text-muted" style="font-size:.75rem">Sube un nuevo archivo para reemplazarlo.</div>
                </div>
            </div>
            ${esArchivo
                ? `<button type="button" onclick="abrirVisorPDF('${cvUrl}')" class="btn btn-outline-success btn-sm">
                       <i class="bi bi-eye me-1"></i>Ver PDF
                   </button>`
                : `<a href="${cvUrl}" target="_blank" rel="noopener" class="btn btn-outline-success btn-sm">
                       <i class="bi bi-box-arrow-up-right me-1"></i>Ver CV
                   </a>`
            }
        </div>`;
}

// Mostrar avatar actual
function renderAvatar(avatarUrl) {
    const preview     = $('avatarPreview');
    const placeholder = $('avatarPlaceholder');
    if (avatarUrl) {
        preview.src               = avatarUrl;
        preview.style.display     = 'block';
        placeholder.style.display = 'none';
    } else {
        preview.style.display     = 'none';
        placeholder.style.display = 'block';
    }
}

// Cargar perfil al iniciar
(async () => {
    try {
        const p = await apiFetch('/candidato/perfil');
        $('nombre').value    = p.nombre    ?? '';
        $('apellidos').value = p.apellidos ?? '';
        $('email').value     = p.email     ?? '';
        $('telefono').value  = p.telefono  ?? '';
        renderCvStatus(p.cv_url ?? null);
        renderAvatar(p.avatar_url ?? null);
    } catch {
        const alertEl = $('alertGeneral');
        alertEl.textContent = 'No se pudo cargar tu perfil.';
        alertEl.classList.remove('d-none');
    }
})();

// Guardar datos personales
$('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = $('alertGeneral');
    const okEl    = $('okGeneral');
    const btn     = e.submitter;

    alertEl.classList.add('d-none');
    okEl.classList.add('d-none');
    btn.disabled = true;

    try {
        const body = {
            nombre:    $('nombre').value.trim(),
            apellidos: $('apellidos').value.trim(),
            telefono:  $('telefono').value.trim() || undefined,
        };
        await apiFetch('/candidato/perfil', { method: 'PUT', body: JSON.stringify(body) });
        okEl.textContent = 'Perfil actualizado correctamente.';
        okEl.classList.remove('d-none');
    } catch (err) {
        alertEl.textContent = err.message ?? 'Error al actualizar.';
        alertEl.classList.remove('d-none');
    } finally {
        btn.disabled = false;
    }
});

// Selección y previsualización de foto de perfil
const avatarFileInput = $('avatarFile');
const btnAvatarUpload = $('btnAvatarUpload');
const avatarFileName  = $('avatarFileName');

avatarFileInput.addEventListener('change', () => {
    const file = avatarFileInput.files[0];
    if (!file) return;

    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!permitidos.includes(file.type)) {
        $('avatarAlert').textContent = 'Solo se permiten imágenes JPG, PNG o WEBP.';
        $('avatarAlert').classList.remove('d-none');
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        $('avatarAlert').textContent = 'La imagen supera el límite de 2 MB.';
        $('avatarAlert').classList.remove('d-none');
        return;
    }

    $('avatarAlert').classList.add('d-none');
    avatarFileName.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
    btnAvatarUpload.disabled = false;

    const reader = new FileReader();
    reader.onload = (ev) => {
        $('avatarPreview').src            = ev.target.result;
        $('avatarPreview').style.display  = 'block';
        $('avatarPlaceholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
});

btnAvatarUpload.addEventListener('click', async () => {
    const file = avatarFileInput.files[0];
    if (!file) return;

    $('avatarAlert').classList.add('d-none');
    $('avatarSuccess').classList.add('d-none');
    btnAvatarUpload.disabled    = true;
    btnAvatarUpload.textContent = 'Subiendo...';

    try {
        const token = localStorage.getItem('token');
        const fd    = new FormData();
        fd.append('avatar', file);

        const res  = await fetch('/api/candidato/perfil/avatar', {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
            body:    fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Error al subir la foto');

        $('avatarSuccess').textContent = 'Foto actualizada correctamente.';
        $('avatarSuccess').classList.remove('d-none');
        avatarFileName.textContent = '';
        renderAvatar(data.avatar_url);
    } catch (err) {
        $('avatarAlert').textContent = err.message ?? 'Error al subir la foto.';
        $('avatarAlert').classList.remove('d-none');
    } finally {
        btnAvatarUpload.disabled  = false;
        btnAvatarUpload.innerHTML = '<i class="bi bi-check2 me-1"></i> Guardar foto';
    }
});

// Selección de CV con drag & drop
const cvFileInput = $('cvFile');
const btnUpload   = $('btnCvUpload');
const fileName    = $('fileName');

function setFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
        $('cvAlert').textContent = 'Solo se permiten archivos PDF.';
        $('cvAlert').classList.remove('d-none');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        $('cvAlert').textContent = 'El archivo supera el límite de 5 MB.';
        $('cvAlert').classList.remove('d-none');
        return;
    }
    $('cvAlert').classList.add('d-none');
    cvFileInput._selectedFile = file;
    fileName.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
    btnUpload.disabled = false;
}

cvFileInput.addEventListener('change', () => setFile(cvFileInput.files[0]));

window.handleDrop = (e) => {
    e.preventDefault();
    $('dropzone').classList.remove('drag-over');
    setFile(e.dataTransfer.files[0]);
};

// Subir CV
btnUpload.addEventListener('click', async () => {
    const file = cvFileInput._selectedFile ?? cvFileInput.files[0];
    if (!file) return;

    $('cvAlert').classList.add('d-none');
    $('cvSuccess').classList.add('d-none');
    btnUpload.disabled    = true;
    btnUpload.textContent = 'Subiendo...';

    try {
        const token = localStorage.getItem('token');
        const fd    = new FormData();
        fd.append('cv', file);

        const res  = await fetch('/api/candidato/perfil/cv', {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
            body:    fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Error al subir el CV');

        $('cvSuccess').textContent = 'CV subido correctamente.';
        $('cvSuccess').classList.remove('d-none');
        fileName.textContent = '';
        cvFileInput._selectedFile = null;
        cvFileInput.value = '';
        renderCvStatus(data.cv_url);
    } catch (err) {
        $('cvAlert').textContent = err.message ?? 'Error al subir el CV.';
        $('cvAlert').classList.remove('d-none');
    } finally {
        btnUpload.disabled  = false;
        btnUpload.innerHTML = '<i class="bi bi-upload me-1"></i> Subir CV';
    }
});

// Visor PDF con overlay personalizado (igual al lado empresa)
window.abrirVisorPDF = (url) => {
    const existente = document.getElementById('_pdfModal');
    if (existente) existente.remove();

    const overlay = document.createElement('div');
    overlay.id        = '_pdfModal';
    overlay.className = 'pdf-overlay';
    overlay.innerHTML = `
        <div class="pdf-box">
            <div class="pdf-header">
                <span class="fw-bold"><i class="bi bi-file-earmark-pdf text-danger me-2"></i>Currículum Vitae</span>
                <div class="d-flex gap-2">
                    <a href="${url}" download class="btn btn-outline-success btn-sm">
                        <i class="bi bi-download"></i> Descargar
                    </a>
                    <button onclick="document.getElementById('_pdfModal').remove()"
                            class="btn btn-danger btn-sm">
                        <i class="bi bi-x-lg"></i> Cerrar
                    </button>
                </div>
            </div>
            <iframe src="${url}" style="flex:1;border:none;width:100%" title="CV"></iframe>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
};

// Logout
$('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); logout(); });
