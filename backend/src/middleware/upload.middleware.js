// backend/src/middleware/upload.middleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegurarnos de que las carpetas de destino existan
const uploadDirs = ['uploads/logos', 'uploads/cvs', 'uploads/avatars'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, 'uploads/cvs/');
        } else if (file.fieldname === 'avatar') {
            cb(null, 'uploads/avatars/');
        } else {
            cb(null, 'uploads/logos/');
        }
    },
    filename: (req, file, cb) => {
        // Generar un nombre único para evitar colisiones: campo-fecha-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no válido. Solo se permiten JPG, PNG, WEBP o PDF.'));
    }
};

export const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite estricto de 5MB por archivo
});
