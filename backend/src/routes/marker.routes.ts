import { Router } from 'express';
import {
  createMarker,
  listMarkers,
  getMarkersByMap,
  getMarkerById,
  updateMarker,
  deleteMarker,
} from '../controllers/marker.controller';
import { auth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createMarkerSchema,
  updateMarkerSchema,
  markerIdParamSchema,
} from '../validators/marker.validator';

const router = Router();

// Retrieve markers (available to ADMIN, OPERATOR, VIEWER)
router.get('/', auth, listMarkers);
router.get('/map/:mapId', auth, getMarkersByMap);
router.get('/:id', auth, validate(markerIdParamSchema), getMarkerById);

// Modify markers (restricted to ADMIN, OPERATOR)
router.post('/', auth, requireRole(['ADMIN', 'OPERATOR']), validate(createMarkerSchema), createMarker);
router.put('/:id', auth, requireRole(['ADMIN', 'OPERATOR']), validate(updateMarkerSchema), updateMarker);
router.delete('/:id', auth, requireRole(['ADMIN', 'OPERATOR']), validate(markerIdParamSchema), deleteMarker);

export default router;
