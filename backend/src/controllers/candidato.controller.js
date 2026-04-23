// backend/src/controllers/candidato.controller.js
import * as svc from '../services/candidato.service.js';

export const getPerfil = async (req, res, next) => {
  try { res.json(await svc.getPerfil(req.user.id)); }
  catch (err) { next(err); }
};

export const actualizarPerfil = async (req, res, next) => {
  try { res.json(await svc.actualizarPerfil(req.user.id, req.body)); }
  catch (err) { next(err); }
};

export const postular = async (req, res, next) => {
  try {
    const aplicacion = await svc.postular(req.user.id, req.params.vacancyId, req.body.mensaje);
    res.status(201).json(aplicacion);
  } catch (err) { next(err); }
};

export const subirAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const data = await svc.subirAvatar(req.user.id, avatarUrl);
    res.json({ message: 'Foto actualizada', avatar_url: data.avatar_url });
  } catch (err) { next(err); }
};

export const subirCv = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo PDF requerido' });
    const cvUrl = `/uploads/cvs/${req.file.filename}`;
    const data  = await svc.subirCv(req.user.id, cvUrl);
    res.json({ message: 'CV subido correctamente', cv_url: data.cv_url });
  } catch (err) { next(err); }
};

export const misPostulaciones = async (req, res, next) => {
  try { res.json(await svc.misPostulaciones(req.user.id)); }
  catch (err) { next(err); }
};

// ── Alertas ───────────────────────────────────────────────────────────
export const getAlertas = async (req, res, next) => {
  try { res.json(await svc.getAlertas(req.user.id)); }
  catch (err) { next(err); }
};

export const crearAlerta = async (req, res, next) => {
  try { res.status(201).json(await svc.crearAlerta(req.user.id, req.body)); }
  catch (err) { next(err); }
};

export const toggleAlerta = async (req, res, next) => {
  try { res.json(await svc.toggleAlerta(req.params.id, req.user.id)); }
  catch (err) { next(err); }
};

export const eliminarAlerta = async (req, res, next) => {
  try { await svc.eliminarAlerta(req.params.id, req.user.id); res.status(204).end(); }
  catch (err) { next(err); }
};

// ── Reviews ───────────────────────────────────────────────────────────
export const crearReview = async (req, res, next) => {
  try {
    const review = await svc.crearReview(req.user.id, req.params.companyId, req.body);
    res.status(201).json(review);
  } catch (err) { next(err); }
};

export const misReviews = async (req, res, next) => {
  try { res.json(await svc.misReviews(req.user.id)); }
  catch (err) { next(err); }
};

// ── Foros ─────────────────────────────────────────────────────────────
export const crearThread = async (req, res, next) => {
  try {
    const thread = await svc.crearThread(req.user.id, req.body);
    res.status(201).json(thread);
  } catch (err) { next(err); }
};

export const crearReply = async (req, res, next) => {
  try {
    const reply = await svc.crearReply(req.user.id, req.params.threadId, req.body.contenido);
    res.status(201).json(reply);
  } catch (err) { next(err); }
};
