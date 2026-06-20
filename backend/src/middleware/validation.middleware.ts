import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/apiError';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate req.body, req.query, and req.params using the Zod schema
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Reassign to preserve parsed/casted fields
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.map((err) => ({
          field: err.path.slice(1).join('.'), // Remove 'body', 'query', or 'params' prefix
          message: err.message,
        }));
        return next(new ApiError(400, 'Request validation failed', errorDetails));
      }
      next(error);
    }
  };
};

export default validate;
