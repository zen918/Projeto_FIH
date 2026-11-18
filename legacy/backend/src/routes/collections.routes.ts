import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler, validateBody } from '../middleware/validate';
import { CollectionsService } from '../services/collections.service';

const service = new CollectionsService();
export const collectionsRoutes = Router();

collectionsRoutes.use(authenticate);

const qualitySchema = z.enum(['excelente', 'boa', 'regular', 'critica']);
const statusSchema = z.enum(['solicitada', 'agendada', 'coletada', 'processada', 'cancelada']);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use uma data no formato AAAA-MM-DD.');

const createSchema = z.object({
  weightKg: z.coerce.number().positive('Informe um peso maior que zero.').max(5000),
  qualityStatus: qualitySchema,
  pickupDate: dateSchema,
  notes: z.string().trim().max(2000).optional().default(''),
  address: z.string().trim().min(3, 'Informe o endereço de retirada.').max(240),
});

const updateSchema = z
  .object({
    status: statusSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
    pickupDate: dateSchema.optional(),
    weightKg: z.coerce.number().positive().max(5000).optional(),
    qualityStatus: qualitySchema.optional(),
    address: z.string().trim().min(3).max(240).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

collectionsRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const collections = await service.list(req.user!);
    res.json({ collections });
  }),
);

collectionsRoutes.post(
  '/',
  requireRole('floricultura'),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const collection = await service.create(req.user!, req.body);
    res.status(201).json({ collection });
  }),
);

collectionsRoutes.patch(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const collection = await service.update(req.user!, req.params.id, req.body);
    res.json({ collection });
  }),
);
