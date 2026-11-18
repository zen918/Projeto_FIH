import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler, validateBody } from '../middleware/validate';
import { OrdersService } from '../services/orders.service';

const service = new OrdersService();
export const ordersRoutes = Router();

ordersRoutes.use(authenticate);

const createSchema = z.object({
  batchId: z.string().uuid('Selecione um lote válido.'),
  quantityKg: z.coerce.number().positive('Informe a quantidade desejada.').max(10000),
  packagingType: z.enum(['sacola', 'filme', 'embalagem_rigida', 'outro']),
  notes: z.string().trim().max(2000).optional().default(''),
});

const updateSchema = z
  .object({
    status: z
      .enum(['solicitado', 'em_analise', 'aprovado', 'em_producao', 'entregue', 'cancelado'])
      .optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

ordersRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await service.list(req.user!);
    res.json({ orders });
  }),
);

ordersRoutes.post(
  '/',
  requireRole('comercio_cliente'),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const order = await service.create(req.user!, req.body);
    res.status(201).json({ order });
  }),
);

ordersRoutes.patch(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const order = await service.update(req.user!, req.params.id, req.body);
    res.json({ order });
  }),
);
