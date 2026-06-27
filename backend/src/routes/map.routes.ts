import { Router } from 'express';
import {
  createMap,
  listMaps,
  getMapById,
  updateMap,
  deleteMap,
} from '../controllers/map.controller';
import { auth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createMapSchema,
  updateMapSchema,
  mapIdParamSchema,
} from '../validators/map.validator';

const router = Router();

// Retrieve list or single map (available to ADMIN, OPERATOR, VIEWER)
router.get('/', auth, listMaps);
router.get('/:id', auth, validate(mapIdParamSchema), getMapById);

// Modify maps (restricted to ADMIN, OPERATOR)
router.post('/', auth, requireRole(['ADMIN', 'OPERATOR']), validate(createMapSchema), createMap);
router.put('/:id', auth, requireRole(['ADMIN', 'OPERATOR']), validate(updateMapSchema), updateMap);
router.delete('/:id', auth, requireRole(['ADMIN', 'OPERATOR']), validate(mapIdParamSchema), deleteMap);

export default router;
