import { Response, NextFunction } from 'express';
import routeService from '../services/route.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { RequestWithUser } from '../types';

export const createRoute = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const route = await routeService.createRoute(req.body, userId);
    res.status(201).json(new ApiResponse(201, route, 'Route path saved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const listRoutes = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sort, search, mapId } = req.query;
    const filter: any = {};
    if (mapId) {
      filter.mapId = mapId;
    }
    const result = await routeService.listRoutes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as string,
      search: search as string,
      filter,
    });
    res.status(200).json(new ApiResponse(200, result, 'Routes list retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getRoutesByMap = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const routes = await routeService.getRoutesByMap(req.params.mapId);
    res.status(200).json(new ApiResponse(200, routes, 'Routes for map loaded successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getRouteById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const route = await routeService.getRouteById(req.params.id);
    res.status(200).json(new ApiResponse(200, route, 'Route details retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

export const updateRoute = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }
    const route = await routeService.updateRoute(req.params.id, req.body, user);
    res.status(200).json(new ApiResponse(200, route, 'Route updated successfully.'));
  } catch (error) {
    next(error);
  }
};

export const deleteRoute = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }
    await routeService.deleteRoute(req.params.id, user);
    res.status(200).json(new ApiResponse(200, null, 'Route deleted successfully.'));
  } catch (error) {
    next(error);
  }
};
