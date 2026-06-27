import { Response, NextFunction } from 'express';
import auditService from '../services/audit.service';
import ApiResponse from '../utils/apiResponse';
import { RequestWithUser } from '../types';

export const listLogs = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sort, search, action, userId } = req.query;
    const filter: any = {};

    if (action) {
      filter.action = action;
    }

    // Role-based scoping: non-admins are restricted to their own logs
    if (req.user?.role !== 'ADMIN') {
      filter.userId = req.user?.userId;
    } else if (userId) {
      filter.userId = userId;
    }

    const result = await auditService.listLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as string,
      search: search as string,
      filter,
    });

    res.status(200).json(new ApiResponse(200, result, 'Audit log database queried successfully.'));
  } catch (error) {
    next(error);
  }
};
