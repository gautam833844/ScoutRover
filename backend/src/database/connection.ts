import mongoose from 'mongoose';
import { env } from '../config/env';
import logger from '../utils/logger';

export async function connectDB(): Promise<void> {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('💾 MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('💾 MongoDB disconnected.');
    });

    await mongoose.connect(env.MONGODB_URI);
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('💾 MongoDB disconnected successfully.');
  } catch (error) {
    logger.error('❌ Error disconnecting MongoDB:', error);
  }
}
