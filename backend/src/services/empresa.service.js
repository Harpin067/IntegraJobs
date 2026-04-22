import { pool } from '../db/db.js';
import crypto from 'crypto';

export const empresaService = {

    /* =========================
       PERFIL EMPRESA
    ========================= */

    async getEmpresaByUserId(userId) {
        const { rows } = await pool.query(
            'SELECT * FROM companies WHERE user_id = $1',
            [userId]
        );

        return rows[0] || null;
    },

    async updatePerfil(userId, data) {
        const { nombre, descripcion, ubicacion, industria, sitioWeb } = data;

        const query = `
            UPDATE companies 
            SET 
                nombre = $1,
                descripcion = $2,
                ubicacion = $3,
                industria = $4,
                sitio_web = $5,
                updated_at = NOW()
            WHERE user_id = $6
            RETURNING *
        `;

        const values = [
            nombre,
            descripcion,
            ubicacion,
            industria,
            sitioWeb || null,
            userId
        ];

        const { rows } = await pool.query(query, values);

        if (!rows[0]) {
            throw new Error('Error al actualizar el perfil de empresa');
        }

        return rows[0];
    },

    async updateLogo(userId, logoUrl) {
        const query = `
            UPDATE companies 
            SET logo_url = $1,
                updated_at = NOW()
            WHERE user_id = $2
            RETURNING *
        `;

        const { rows } = await pool.query(query, [logoUrl, userId]);
        return rows[0];
    },

    /* =========================
       VACANTES
    ========================= */

    async findVacantesByUserId(userId) {
        const query = `
            SELECT
                v.*,
                COUNT(a.id)::int AS total_postulaciones,
                SUM(CASE WHEN a.status::text = 'nuevo'      THEN 1 ELSE 0 END)::int AS nuevos,
                SUM(CASE WHEN a.status::text = 'en_proceso' THEN 1 ELSE 0 END)::int AS en_proceso,
                SUM(CASE WHEN a.status::text = 'contratado' THEN 1 ELSE 0 END)::int AS contratados,
                SUM(CASE WHEN a.status::text = 'rechazado'  THEN 1 ELSE 0 END)::int AS rechazados
            FROM vacancies v
            JOIN companies c ON v.company_id = c.id
            LEFT JOIN applications a ON v.id = a.vacancy_id
            WHERE c.user_id = $1
            GROUP BY v.id
            ORDER BY v.created_at DESC
        `;

        const { rows } = await pool.query(query, [userId]);
        return rows;
    },

    async saveVacante(companyId, data) {
        const {
            titulo,
            descripcion,
            requisitos,
            ubicacion,
            tipoTrabajo,
            tipoContrato,
            experiencia,
            contacto,
            salarioMin,
            salarioMax
        } = data;

        const query = `
            INSERT INTO vacancies (
                id,
                company_id,
                titulo,
                descripcion,
                requisitos,
                ubicacion,
                tipo_trabajo,
                tipo_contrato,
                experiencia,
                contacto,
                salario_min,
                salario_max,
                updated_at
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7::"TipoTrabajo",$8::"TipoContrato",$9::"Experiencia",$10,$11,$12,NOW())
            RETURNING *
        `;

        const values = [
            crypto.randomUUID(),
            companyId,
            titulo,
            descripcion,
            requisitos,
            ubicacion,
            tipoTrabajo,
            tipoContrato,
            experiencia,
            contacto,
            salarioMin || null,
            salarioMax || null
        ];

        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    async updateVacante(vacancyId, userId, data) {
        const authCheck = await pool.query(
            `SELECT v.id 
             FROM vacancies v 
             JOIN companies c ON v.company_id = c.id 
             WHERE v.id = $1 AND c.user_id = $2`,
            [vacancyId, userId]
        );

        if (authCheck.rows.length === 0) {
            throw new Error('No autorizado para modificar esta vacante');
        }

        const validColumns = {
            titulo: 'titulo',
            descripcion: 'descripcion',
            requisitos: 'requisitos',
            ubicacion: 'ubicacion',
            status: 'status',
            tipoTrabajo: 'tipo_trabajo',
            tipoContrato: 'tipo_contrato',
            experiencia: 'experiencia',
            contacto: 'contacto',
            salarioMin: 'salario_min',
            salarioMax: 'salario_max'
        };

        const updates = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(data)) {
            if (validColumns[key] && value !== undefined) {
                updates.push(`${validColumns[key]} = $${index}`);
                values.push(value);
                index++;
            }
        }

        if (updates.length === 0) {
            return null;
        }

        values.push(vacancyId);

        const query = `
            UPDATE vacancies 
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $${index}
            RETURNING *
        `;

        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    /* =========================
       ATS (CANDIDATOS)
    ========================= */

    async getPostulaciones(vacancyId, userId) {
        const query = `
            SELECT 
                a.id AS aplicacion_id,
                a.status,
                a.mensaje,
                a.created_at,
                u.nombre,
                u.apellidos,
                u.email,
                u.cv_url,
                u.telefono
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN vacancies v ON a.vacancy_id = v.id
            JOIN companies c ON v.company_id = c.id
            WHERE v.id = $1 AND c.user_id = $2
            ORDER BY a.created_at DESC
        `;

        const { rows } = await pool.query(query, [vacancyId, userId]);
        return rows;
    },

    async updatePostulacionStatus(appId, status, userId) {
        const query = `
            UPDATE applications a
            SET status = $1,
                updated_at = NOW()
            FROM vacancies v, companies c
            WHERE a.vacancy_id = v.id
              AND v.company_id = c.id
              AND c.user_id = $2
              AND a.id = $3
            RETURNING a.id, a.status, a.updated_at
        `;

        const { rows } = await pool.query(query, [status, userId, appId]);

        if (!rows[0]) {
            throw new Error('Aplicación no encontrada o no pertenece a tu empresa');
        }

        return rows[0];
    }
};
