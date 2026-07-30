import { Request, Response, NextFunction } from 'express';
import { claimService } from '../services/claim.service';
import { qrService } from '../services/qr.service';

export class ClaimController {
  /**
   * Endpoint: POST /reward/claim
   */
  public claim = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { campaignId, stageId, verificationData } = req.body;
      const user = (req as any).user;

      if (!campaignId || !stageId) {
        res.status(400).json({ error: 'campaignId and stageId are required' });
        return;
      }

      const claim = await claimService.claimReward(
        user._id.toString(),
        user.walletAddress,
        campaignId,
        stageId,
        verificationData
      );

      res.status(200).json({ success: true, claim });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to claim reward' });
    }
  };

  /**
   * Endpoint: GET /reward/history
   */
  public history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const history = await claimService.getHistory(user.walletAddress);
      res.status(200).json({ history });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint: GET /reward/organizer/history
   */
  public organizerHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const history = await claimService.getOrganizerHistory(user._id.toString());
      res.status(200).json({ history });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint: POST /qr/generate (Organizer only)
   * Body: { stageId }
   */
  public generateQr = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stageId } = req.body;
      if (!stageId) {
        res.status(400).json({ error: 'stageId is required' });
        return;
      }

      const token = qrService.generateDynamicToken(stageId);
      res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
  };
}

export const claimController = new ClaimController();
