import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '../utils/logger';

export let mongoServer: any = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    if (config.nodeEnv === 'development' && config.mongoUri.includes('localhost')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        logger.info(`Starting in-memory MongoDB server: ${uri}`);
        await mongoose.connect(uri);
        return;
      } catch (err) {
        logger.error(`Failed to start in-memory MongoDB server: ${err}. Falling back to standard URI.`);
      }
    }

    await mongoose.connect(config.mongoUri, { family: 4 });
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error}`);
    process.exit(1);
  }
};
