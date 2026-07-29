import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '../utils/logger';

export let mongoServer: any = null;
let cachedConnectionPromise: Promise<typeof mongoose> | null = null;

export const connectDatabase = async (): Promise<void> => {
  // If already connected, do nothing
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // If connection is in progress, await it
  if (cachedConnectionPromise) {
    await cachedConnectionPromise;
    return;
  }

  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      cachedConnectionPromise = null;
    });

    if (config.nodeEnv === 'development' && config.mongoUri.includes('localhost')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        logger.info(`Starting in-memory MongoDB server: ${uri}`);
        cachedConnectionPromise = mongoose.connect(uri);
        await cachedConnectionPromise;
        
        import('./seed')
          .then(m => m.seedDatabase())
          .catch(err => logger.error(`In-memory database seeding failed: ${err}`));
          
        return;
      } catch (err) {
        logger.error(`Failed to start in-memory MongoDB server: ${err}. Falling back to standard URI.`);
      }
    }

    logger.info('Establishing new MongoDB connection...');
    cachedConnectionPromise = mongoose.connect(config.mongoUri, { 
      family: 4,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await cachedConnectionPromise;
    
    // Asynchronously run seeding so it doesn't block server start or request handling
    import('./seed')
      .then(m => m.seedDatabase())
      .catch(err => logger.error(`Database seeding execution failed: ${err}`));
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error}`);
    cachedConnectionPromise = null;
    throw error;
  }
};
