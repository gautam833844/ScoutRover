import { Response, NextFunction } from 'express';
import userService from '../services/user.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { RequestWithUser } from '../types';
import auditService from '../services/audit.service';

export const getProfile = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    const profile = await userService.getProfile(userId);
    res.status(200).json(new ApiResponse(200, profile, 'Profile retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    const profile = await userService.updateProfile(userId, req.body);
    res.status(200).json(new ApiResponse(200, profile, 'Profile updated successfully.'));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(userId, currentPassword, newPassword);
    res.status(200).json(new ApiResponse(200, null, 'Password updated successfully.'));
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    if (!req.file) throw new ApiError(400, 'Please upload an image file.');

    // Avatar static serving URL
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await userService.updateProfile(userId, { avatar: avatarUrl });

    await auditService.log({
      userId,
      action: 'USER_AVATAR_UPLOAD',
      description: `Uploaded profile avatar image: ${req.file.filename}`,
    });

    res.status(200).json(new ApiResponse(200, user, 'Avatar uploaded successfully.'));
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sort, search } = req.query;
    const result = await userService.listUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as string,
      search: search as string,
    });
    res.status(200).json(new ApiResponse(200, result, 'User list loaded successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(new ApiResponse(200, user, 'User profile fetched successfully.'));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user?.userId;
    if (!actorId) throw new ApiError(401, 'Unauthorized');
    const user = await userService.updateUser(req.params.id, req.body, actorId);
    res.status(200).json(new ApiResponse(200, user, 'User updated successfully.'));
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user?.userId;
    if (!actorId) throw new ApiError(401, 'Unauthorized');
    await userService.deleteUser(req.params.id, actorId);
    res.status(200).json(new ApiResponse(200, null, 'User deleted successfully.'));
  } catch (error) {
    next(error);
  }
};
