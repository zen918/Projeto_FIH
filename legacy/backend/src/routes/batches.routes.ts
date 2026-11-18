import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler, validateBody } from '../middleware/validate';
import { BatchesService } from '../services/batches.service';
import { StorageService } from '../services/storage.service';

const service = new BatchesService();
const storage = new StorageService();
export const batchesRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

batchesRoutes.use(authenticate);

const createSchema = z.object({
  collectionId: z.string().uuid('Selecione uma coleta válida.'),
  formulaVersion: z.string().trim().min(2, 'Informe a formulação.').max(120),
  weightProducedKg: z.coerce.number().positive('Informe o peso produzido.').max(100000),
  biodegradationDays: z.coerce
    .number()
    .int('Informe um número inteiro de dias.')
    .positive('Informe o tempo de biodegradação.')
    .max(3650),
  tensileStrength: z.coerce
    .number()
    .positive('Informe a resistência à tração.')
    .max(500),
  notes: z.string().trim().max(2000).optional().default(''),
});

const updateSchema = z
  .object({
    status: z.enum(['em_producao', 'concluido', 'arquivado']).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

batchesRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const batches = await service.list(req.user!);
    res.json({ batches });
  }),
);

batchesRoutes.post(
  '/',
  requireRole('pesquisador_lab', 'superadmin'),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const batch = await service.create(req.user!, req.body);
    res.status(201).json({ batch });
  }),
);

batchesRoutes.patch(
  '/:id',
  requireRole('pesquisador_lab', 'superadmin'),
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const batch = await service.update(req.user!, req.params.id, req.body);
    res.json({ batch });
  }),
);

batchesRoutes.post(
  '/:id/evidence',
  requireRole('pesquisador_lab', 'superadmin'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const evidenceUrl = await storage.uploadEvidence(req.params.id, req.file);
    const batch = await service.setEvidence(req.user!, req.params.id, evidenceUrl);
    res.json({ batch });
  }),
);
