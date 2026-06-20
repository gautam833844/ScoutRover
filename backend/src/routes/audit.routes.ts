import { Router } from 'express';
import { listLogs } from '../controllers/audit.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Expose logs (controller enforces that non-admins can only see their own logs)
router.get('/', auth, listLogs);

export default router;
