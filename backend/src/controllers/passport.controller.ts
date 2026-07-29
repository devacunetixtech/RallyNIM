import { Request, Response, NextFunction } from 'express';
import { Passport } from '../models/Passport';

export class PassportController {
  /**
   * Endpoint: GET /passport
   */
  public getMyPassport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const passport = await Passport.findOne({ walletAddress: user.walletAddress })
        .populate('eventsAttended', 'title category startDate location')
        .populate('campaignsCompleted', 'title category endDate');

      if (!passport) {
        res.status(404).json({ error: 'Passport not found' });
        return;
      }

      res.status(200).json({ passport });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint: GET /passport/:walletAddress (Public lookup)
   */
  public getPublicPassport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { walletAddress } = req.params;
      const passport = await Passport.findOne({ walletAddress: walletAddress.toLowerCase().trim() })
        .populate('eventsAttended', 'title category startDate location')
        .populate('campaignsCompleted', 'title category endDate');

      if (!passport) {
        res.status(404).json({ error: 'Passport not found' });
        return;
      }

      res.status(200).json({ passport });
    } catch (error) {
      next(error);
    }
  };
}

export const passportController = new PassportController();
