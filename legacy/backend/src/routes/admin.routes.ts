import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler, validateBody } from '../middleware/validate';
import { AdminService } from '../services/admin.service';

const service = new AdminService();
export const adminRoutes = Router();

adminRoutes.use(authenticate, requireRole('superadmin'));

const updateSchema = z
  .object({
    role: z.enum(['superadmin', 'floricultura', 'comercio_cliente', 'pesquisador_lab']).optional(),
    status: z.enum(['pending', 'active', 'blocked']).optional(),
  })
  .refine((value) => value.role !== undefined || value.status !== undefined, {
    message: 'Informe o perfil ou o status a atualizar.',
  });

adminRoutes.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await service.listUsers(req.user!);
    res.json({ users });
  }),
);

adminRoutes.patch(
  '/users/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const user = await service.updateUser(req.user!, req.params.id, req.body);
    res.json({ user });
  }),
);
