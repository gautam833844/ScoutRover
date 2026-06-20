import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { RequestWithUser } from '../types';

export const requireRole = (allowedRoles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized. Please authenticate first.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access Forbidden. Your role '${req.user.role}' is not authorized for this resource.`
        )
      );
    }

    next();
  };
};

export default requireRole;
