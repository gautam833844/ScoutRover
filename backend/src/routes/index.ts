import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import mapRoutes from './map.routes';
import markerRoutes from './marker.routes';
import routeRoutes from './route.routes';
import auditRoutes from './audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/maps', mapRoutes);
router.use('/markers', markerRoutes);
router.use('/routes', routeRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
