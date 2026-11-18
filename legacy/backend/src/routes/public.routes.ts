import { Router } from 'express';
import { env } from '../config/env';
import { asyncHandler } from '../middleware/validate';
import { TraceService } from '../services/trace.service';
import { buildTraceUrl, generateQrCodePng } from '../utils/qr';

const service = new TraceService();
export const publicRoutes = Router();

publicRoutes.get(
  '/trace/:code',
  asyncHandler(async (req, res) => {
    const trace = await service.getByCode(req.params.code);
    res.json({ trace });
  }),
);

publicRoutes.get(
  '/trace/:code/qr.png',
  asyncHandler(async (req, res) => {
    const trace = await service.getByCode(req.params.code);
    const png = await generateQrCodePng(
      buildTraceUrl(trace.batch.traceCode, env.publicAppUrl),
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(png);
  }),
);
