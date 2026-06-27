import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    // Log severity matches response status code
    if (statusCode >= 500) {
      logger.error(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms - IP: ${ip}`);
    } else if (statusCode >= 400) {
      logger.warn(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms - IP: ${ip}`);
    } else {
      logger.info(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms - IP: ${ip}`);
    }
  });

  next();
};

export default requestLogger;
