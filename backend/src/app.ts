import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Route imports
import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import claimRoutes from './routes/claim.routes';
import passportRoutes from './routes/passport.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { authRateLimiter } from './middleware/rateLimiter.middleware';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for testing/Mini-App integration
  credentials: true
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight Custom Cookie Parser middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts.shift()?.trim();
      const value = parts.join('=')?.trim();
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  (req as any).cookies = cookies;
  next();
});

// Logging
app.use(morgan('dev'));

// API Version prefix
const API_PREFIX = '/api/v1';

// Mount Routes
app.use(`${API_PREFIX}/auth`, authRateLimiter, authRoutes);
app.use(`${API_PREFIX}/campaigns`, campaignRoutes);
app.use(`${API_PREFIX}/reward`, claimRoutes);
app.use(`${API_PREFIX}/passport`, passportRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
