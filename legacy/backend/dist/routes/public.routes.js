"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRoutes = void 0;
const express_1 = require("express");
const env_1 = require("../config/env");
const validate_1 = require("../middleware/validate");
const trace_service_1 = require("../services/trace.service");
const qr_1 = require("../utils/qr");
const service = new trace_service_1.TraceService();
exports.publicRoutes = (0, express_1.Router)();
exports.publicRoutes.get('/trace/:code', (0, validate_1.asyncHandler)(async (req, res) => {
    const trace = await service.getByCode(req.params.code);
    res.json({ trace });
}));
exports.publicRoutes.get('/trace/:code/qr.png', (0, validate_1.asyncHandler)(async (req, res) => {
    const trace = await service.getByCode(req.params.code);
    const png = await (0, qr_1.generateQrCodePng)((0, qr_1.buildTraceUrl)(trace.batch.traceCode, env_1.env.publicAppUrl));
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(png);
}));
//# sourceMappingURL=public.routes.js.map