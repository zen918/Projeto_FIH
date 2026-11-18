import { Router } from 'express';
import { adminRoutes } from './admin.routes';
import { batchesRoutes } from './batches.routes';
import { collectionsRoutes } from './collections.routes';
import { impactRoutes } from './impact.routes';
import { ordersRoutes } from './orders.routes';
import { profileRoutes } from './profile.routes';
import { publicRoutes } from './public.routes';

export const apiRoutes = Router();

apiRoutes.use('/public', publicRoutes);
apiRoutes.use('/profile', profileRoutes);
apiRoutes.use('/collections', collectionsRoutes);
apiRoutes.use('/batches', batchesRoutes);
apiRoutes.use('/orders', ordersRoutes);
apiRoutes.use('/impact', impactRoutes);
apiRoutes.use('/admin', adminRoutes);
