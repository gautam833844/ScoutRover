import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { RequestWithUser, TokenPayload } from '../types';

export const auth = (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Access denied. No authorization token provided.'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(new ApiError(401, 'Access denied. Token is missing.'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Your session token has expired. Please log in again.'));
    }
    return next(new ApiError(401, 'Unauthorized access. Invalid session token.'));
  }
};

export default auth;
