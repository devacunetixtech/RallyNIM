import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  /**
   * Endpoint: POST /auth/connect
   * Body: { walletAddress }
   */
  public connect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        res.status(400).json({ error: 'walletAddress is required' });
        return;
      }

      const nonce = authService.generateNonce(walletAddress);
      res.status(200).json({ nonce });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint: POST /auth/verify
   * Body: { walletAddress, signature, publicKey }
   */
  public verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { walletAddress, signature, publicKey } = req.body;
      if (!walletAddress || !signature || !publicKey) {
        res.status(400).json({ error: 'walletAddress, signature, and publicKey are required' });
        return;
      }

      const { token, refreshToken, user } = await authService.verifySignature(
        walletAddress,
        signature,
        publicKey
      );

      // Set refresh token in HTTPOnly secure cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.status(200).json({ token, user });
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Authentication failed' });
    }
  };

  /**
   * Endpoint: POST /auth/refresh
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token missing' });
        return;
      }

      const { token, user } = await authService.refreshSession(refreshToken);
      res.status(200).json({ token, user });
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Session refresh failed' });
    }
  };

  /**
   * Endpoint: POST /auth/logout
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint: GET /auth/me
   */
  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // User is injected by authMiddleware
      const user = (req as any).user;
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
