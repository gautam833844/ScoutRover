import { Response, NextFunction } from 'express';
import mapService from '../services/map.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { RequestWithUser } from '../types';

export const createMap = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const map = await mapService.createMap(req.body, userId);
    res.status(201).json(new ApiResponse(201, map, 'Map saved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const listMaps = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sort, search } = req.query;
    const result = await mapService.listMaps({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as string,
      search: search as string,
    });
    res.status(200).json(new ApiResponse(200, result, 'Maps retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getMapById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const map = await mapService.getMapById(req.params.id);
    res.status(200).json(new ApiResponse(200, map, 'Map retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const updateMap = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const map = await mapService.updateMap(req.params.id, req.body, userId);
    res.status(200).json(new ApiResponse(200, map, 'Map updated successfully.'));
  } catch (error) {
    next(error);
  }
};

export const deleteMap = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    await mapService.deleteMap(req.params.id, userId);
    res.status(200).json(new ApiResponse(200, null, 'Map deleted successfully.'));
  } catch (error) {
    next(error);
  }
};
