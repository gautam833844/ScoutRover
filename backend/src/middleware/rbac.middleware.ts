import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { RequestWithUser } from '../types';
import mongoose from 'mongoose';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized. Please authenticate first.'));
    }

    try {
      const User = mongoose.model('User');
      const dbUser = await User.findById(req.user.userId);
      const actualRole = dbUser ? dbUser.get('role') : req.user.role;

      if (actualRole === 'ADMIN' || allowedRoles.includes(actualRole)) {
        req.user.role = actualRole;
        return next();
      }

      return next(
        new ApiError(
          403,
          `Access Forbidden. Your role '${actualRole}' is not authorized for this resource.`
        )
      );
    } catch (err) {
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }
      return next(
        new ApiError(
          403,
          `Access Forbidden. Your role '${req.user.role}' is not authorized for this resource.`
        )
      );
    }
  };
};

export default requireRole;
