import { Router } from 'express';
import {
  createRoute,
  listRoutes,
  getRoutesByMap,
  getRouteById,
  updateRoute,
  deleteRoute,
} from '../controllers/route.controller';
import { auth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createRouteSchema,
  updateRouteSchema,
  routeIdParamSchema,
} from '../validators/route.validator';

const router = Router();

// Retrieve routes (available to ADMIN, OPERATOR, VIEWER)
router.get('/', auth, listRoutes);
router.get('/map/:mapId', auth, getRoutesByMap);
router.get('/:id', auth, validate(routeIdParamSchema), getRouteById);

// Modify routes (restricted to ADMIN, OPERATOR)
router.post('/', auth, requireRole(['ADMIN', 'OPERATOR']), validate(createRouteSchema), createRoute);
router.put('/:id', auth, requireRole(['ADMIN', 'OPERATOR']), validate(updateRouteSchema), updateRoute);
router.delete('/:id', auth, requireRole(['ADMIN', 'OPERATOR']), validate(routeIdParamSchema), deleteRoute);

export default router;
