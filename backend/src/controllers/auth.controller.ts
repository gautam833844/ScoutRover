import { Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import auditService from '../services/audit.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { RequestWithUser } from '../types';

export const register = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body, req.ip, req.headers['user-agent']);
    // Omit password field
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json(new ApiResponse(201, userObj, 'Registration completed successfully.'));
  } catch (error) {
    next(error);
  }
};

export const login = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body, req.ip, req.headers['user-agent']);
    res.status(200).json(new ApiResponse(200, result, 'Login completed successfully.'));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await auditService.log({
        userId: req.user.userId,
        action: 'USER_LOGOUT',
        description: 'User logged out from session.',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    res.status(200).json(new ApiResponse(200, null, 'Logout completed successfully.'));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }
    const tokens = await authService.refresh(refreshToken);
    res.status(200).json(new ApiResponse(200, tokens, 'Token refreshed successfully.'));
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          'If the email exists, a password reset link has been dispatched.'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json(new ApiResponse(200, null, 'Password has been reset successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized. Please authenticate.');
    }
    const profile = await userService.getProfile(userId);
    res.status(200).json(new ApiResponse(200, profile, 'User profile fetched successfully.'));
  } catch (error) {
    next(error);
  }
};
