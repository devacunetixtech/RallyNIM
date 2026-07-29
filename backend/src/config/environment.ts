import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but missing`);
  }
  return value;
};

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: isProduction ? requiredEnv('MONGODB_URI') : (process.env.MONGODB_URI || 'mongodb://localhost:27017/rallynim'),
  jwtSecret: isProduction ? requiredEnv('JWT_SECRET') : (process.env.JWT_SECRET || 'fallback_jwt_secret_for_development_change_in_production'),
  jwtExpiration: process.env.JWT_EXPIRATION || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  network: (process.env.NETWORK || 'testnet') as 'testnet' | 'mainnet',
  escrowWalletAddress: isProduction ? requiredEnv('ESCROW_WALLET_ADDRESS') : (process.env.ESCROW_WALLET_ADDRESS || 'NQ00 0000 0000 0000 0000 0000 0000 0000 0000'),
  hotWalletPrivateKey: isProduction ? requiredEnv('HOT_WALLET_PRIVATE_KEY') : (process.env.HOT_WALLET_PRIVATE_KEY || ''),
};
