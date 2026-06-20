import { Response, NextFunction } from 'express';
import markerService from '../services/marker.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { RequestWithUser } from '../types';

export const createMarker = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const marker = await markerService.createMarker(req.body, userId);
    res.status(201).json(new ApiResponse(201, marker, 'Marker created successfully.'));
  } catch (error) {
    next(error);
  }
};

export const listMarkers = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sort, search, mapId } = req.query;
    const filter: any = {};
    if (mapId) {
      filter.mapId = mapId;
    }
    const result = await markerService.listMarkers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as string,
      search: search as string,
      filter,
    });
    res.status(200).json(new ApiResponse(200, result, 'Markers list retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getMarkersByMap = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const markers = await markerService.getMarkersByMap(req.params.mapId);
    res.status(200).json(new ApiResponse(200, markers, 'Markers for map loaded successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getMarkerById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const marker = await markerService.getMarkerById(req.params.id);
    res.status(200).json(new ApiResponse(200, marker, 'Marker details retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const updateMarker = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const marker = await markerService.updateMarker(req.params.id, req.body, userId);
    res.status(200).json(new ApiResponse(200, marker, 'Marker updated successfully.'));
  } catch (error) {
    next(error);
  }
};

export const deleteMarker = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    await markerService.deleteMarker(req.params.id, userId);
    res.status(200).json(new ApiResponse(200, null, 'Marker deleted successfully.'));
  } catch (error) {
    next(error);
  }
};
