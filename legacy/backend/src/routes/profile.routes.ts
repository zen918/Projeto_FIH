import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { asyncHandler, validateBody } from '../middleware/validate';
import { ProfileService } from '../services/profile.service';

const service = new ProfileService();
export const profileRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

profileRoutes.use(authenticate);

const updateSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Informe seu nome completo.').max(120).optional(),
    phone: z.string().trim().min(8, 'Informe um telefone válido.').max(30).optional(),
    organizationName: z.string().trim().min(2, 'Informe a organização.').max(160).optional(),
    city: z.string().trim().min(2, 'Informe a cidade.').max(80).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

profileRoutes.get('/', (req, res) => {
  res.json({ user: req.user });
});

profileRoutes.patch(
  '/',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const user = await service.update(req.user!, req.body);
    res.json({ user });
  }),
);

profileRoutes.post(
  '/avatar',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const user = await service.updateAvatar(req.user!, req.file);
    res.json({ user });
  }),
);
