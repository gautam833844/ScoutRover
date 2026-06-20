import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { auth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
  adminUpdateUserSchema,
  userIdParamSchema,
} from '../validators/user.validator';

const router = Router();

// User profile endpoints
router.get('/profile', auth, getProfile);
router.put('/profile', auth, validate(updateProfileSchema), updateProfile);
router.put('/change-password', auth, validate(changePasswordSchema), changePassword);
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

// Admin-only user management endpoints
router.get('/', auth, requireRole(['ADMIN']), listUsers);
router.get('/:id', auth, requireRole(['ADMIN']), validate(userIdParamSchema), getUserById);
router.put('/:id', auth, requireRole(['ADMIN']), validate(adminUpdateUserSchema), updateUser);
router.delete('/:id', auth, requireRole(['ADMIN']), validate(userIdParamSchema), deleteUser);

export default router;
