import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/validate';
import { ImpactService } from '../services/impact.service';

const service = new ImpactService();
export const impactRoutes = Router();

impactRoutes.use(authenticate);

impactRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const impact = await service.get(req.user!);
    res.json({ impact });
  }),
);
