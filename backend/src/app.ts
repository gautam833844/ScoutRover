import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';
import { env } from './config/env';
import { connectDB } from './database/connection';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import v1Routes from './routes';
import logger from './utils/logger';

const app = express();

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows loading files via local HTTP requests (e.g. avatars)
}));

// Enable JSON and URL-encoded parsers with route-specific payload size limits
app.use('/api/v1/maps', express.json({ limit: '50mb' }));
app.use('/api/v1/maps', express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ limit: '200kb', extended: true }));

// Enable CORS
const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like local servers or postman/curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 auth requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

if (env.NODE_ENV !== 'test') {
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/forgot-password', authLimiter);
  app.use('/api', limiter);
}

// Request logging middleware
app.use(requestLogger);

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Swagger API Documentation endpoint
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount v1 routes
app.use('/api/v1', v1Routes);

// Root route placeholder
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Atlas Autonomous Mapping Dashboard API Server',
    documentation: '/api/docs',
    version: '2.0.0',
  });
});

// Capture non-existent routes
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler middleware
app.use(errorHandler);

// Establish database connection and start listening
const startServer = async () => {
  if (env.NODE_ENV !== 'test') {
    await connectDB();

    try {
      const mongoose = await import('mongoose');
      const User = mongoose.model('User');
      const result = await User.updateMany(
        { email: { $in: ['admin@scoutrover.local', 'admin@atlas.io'] } },
        { $set: { role: 'ADMIN' } }
      );
      if (result.modifiedCount > 0) {
        logger.info(`[Migration] Promoted ${result.modifiedCount} user(s) to ADMIN role.`);
      }
    } catch (err) {
      logger.error('Failed to run role promotion migration:', err);
    }

    app.listen(env.PORT, () => {
      logger.info(`🚀 Atlas Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`📖 API documentation available at http://localhost:${env.PORT}/api/docs`);
    });
  }
};

startServer();

export { app };
export default app;
