import { empresaService } from '../services/empresa.service.js';

export const empresaController = {

    /* =========================
       PERFIL
    ========================= */

    async getPerfil(req, res) {
        const userId = req.user.sub || req.user.id;

        if (!userId) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        const perfil = await empresaService.getEmpresaByUserId(userId);

        if (!perfil) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        res.json(perfil);
    },

    async updatePerfil(req, res) {
        try {
            const userId = req.user.sub || req.user.id;
            const data = await empresaService.updatePerfil(userId, req.body);

            res.json({
                message: 'Perfil actualizado con éxito',
                data
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async uploadLogo(req, res) {
        if (!req.file) {
            return res.status(400).json({ error: 'Archivo requerido' });
        }

        const userId = req.user.sub || req.user.id;
        const logoUrl = `/uploads/logos/${req.file.filename}`;

        const empresa = await empresaService.updateLogo(userId, logoUrl);

        res.json({
            message: 'Logo actualizado con éxito',
            logo_url: empresa.logo_url
        });
    },

    /* =========================
       VACANTES
    ========================= */

    async getMisVacantes(req, res) {
        const userId = req.user.sub || req.user.id;
        const vacantes = await empresaService.findVacantesByUserId(userId);
        res.json(vacantes);
    },

    async createVacante(req, res) {
        const userId = req.user.sub || req.user.id;

        const empresa = await empresaService.getEmpresaByUserId(userId);

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        const vacante = await empresaService.saveVacante(empresa.id, req.body);

        res.status(201).json({
            message: 'Vacante creada',
            data: vacante
        });
    },

    async updateVacante(req, res) {
        const userId = req.user.sub || req.user.id;
        const { id } = req.params;

        const vacante = await empresaService.updateVacante(id, userId, req.body);

        res.json({
            message: 'Vacante actualizada',
            data: vacante
        });
    },

    /* =========================
       ATS
    ========================= */

    async getAplicacionesPorVacante(req, res) {
        const userId = req.user.sub || req.user.id;
        const { id } = req.params;

        const data = await empresaService.getPostulaciones(id, userId);

        res.json(data);
    },

    async updateStatusAplicacion(req, res) {
        const userId = req.user.sub || req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        const data = await empresaService.updatePostulacionStatus(
            id,
            status,
            userId
        );

        res.json({
            message: 'Estado actualizado',
            data
        });
    }
};
