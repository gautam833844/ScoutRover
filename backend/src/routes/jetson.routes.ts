import { Router } from 'express';
import { exportMapToJetson } from '../controllers/jetson.controller';
import { auth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// Export static maps directly to the Jetson filesystem (restricted to ADMIN, OPERATOR)
router.post('/export', auth, requireRole(['ADMIN', 'OPERATOR']), exportMapToJetson);

export default router;
