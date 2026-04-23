// backend/src/controllers/admin.controller.js
import * as svc from '../services/admin.service.js';

export const listarUsuarios = async (req, res, next) => {
  try { res.json(await svc.listarUsuarios()); }
  catch (err) { next(err); }
};

export const toggleUsuario = async (req, res, next) => {
  try { res.json(await svc.toggleUsuario(req.params.userId)); }
  catch (err) { next(err); }
};

export const listarEmpresas = async (req, res, next) => {
  try { res.json(await svc.listarEmpresas()); }
  catch (err) { next(err); }
};

export const empresasPendientes = async (req, res, next) => {
  try { res.json(await svc.empresasPendientes()); }
  catch (err) { next(err); }
};

export const verificarEmpresa = async (req, res, next) => {
  try { res.json(await svc.verificarEmpresa(req.params.companyId, req.body.verificar)); }
  catch (err) { next(err); }
};

export const vacantesPendientes = async (req, res, next) => {
  try { res.json(await svc.vacantesPendientes()); }
  catch (err) { next(err); }
};

export const aprobarVacante = async (req, res, next) => {
  try { res.json(await svc.aprobarVacante(req.params.vacancyId, req.body.aprobar)); }
  catch (err) { next(err); }
};

export const listarValoraciones = async (req, res, next) => {
  try { res.json(await svc.listarValoraciones()); }
  catch (err) { next(err); }
};

export const aprobarValoracion = async (req, res, next) => {
  try { res.json(await svc.aprobarValoracion(req.params.reviewId, req.body.aprobar)); }
  catch (err) { next(err); }
};

export const listarForoCategorias = async (req, res, next) => {
  try { res.json(await svc.listarForoCategorias()); } catch (err) { next(err); }
};

export const crearForoCategoria = async (req, res, next) => {
  try { res.json(await svc.crearForoCategoria(req.body.nombre, req.body.descripcion)); }
  catch (err) { next(err); }
};

export const eliminarForoCategoria = async (req, res, next) => {
  try { await svc.eliminarForoCategoria(req.params.categoryId); res.json({ ok: true }); }
  catch (err) { next(err); }
};

export const listarForoThreads = async (req, res, next) => {
  try { res.json(await svc.listarForoThreads()); } catch (err) { next(err); }
};

export const moderarThread = async (req, res, next) => {
  try { res.json(await svc.moderarThread(req.params.threadId, req.body.aprobar)); }
  catch (err) { next(err); }
};

export const eliminarThread = async (req, res, next) => {
  try { await svc.eliminarThread(req.params.threadId); res.json({ ok: true }); }
  catch (err) { next(err); }
};

// ── Stats / Charts ──────────────────────────────────────────
export const getChartStats = async (req, res, next) => {
  try { res.json(await svc.getChartStats()); }
  catch (err) { next(err); }
};

// ── Recursos ────────────────────────────────────────────────
export const listarRecursos = async (req, res, next) => {
  try { res.json(await svc.listarRecursos()); }
  catch (err) { next(err); }
};

export const crearRecurso = async (req, res, next) => {
  try { res.status(201).json(await svc.crearRecurso(req.body)); }
  catch (err) { next(err); }
};

export const toggleRecurso = async (req, res, next) => {
  try { res.json(await svc.toggleRecurso(req.params.resourceId)); }
  catch (err) { next(err); }
};

export const eliminarRecurso = async (req, res, next) => {
  try { await svc.eliminarRecurso(req.params.resourceId); res.json({ ok: true }); }
  catch (err) { next(err); }
};
