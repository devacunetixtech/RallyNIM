import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { campaignService } from '../services/campaign.service';
import { createCampaignSchema } from '../validators/campaign.validator';

export class CampaignController {
  /**
   * Endpoint: POST /campaign
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = createCampaignSchema.parse(req.body);
      const { title, description, banner, category, rewardPool, startDate, endDate, location, latitude, longitude, stages } = parsedBody;
      const organizer = (req as any).user._id;

      const { campaign, stages: createdStages } = await campaignService.createCampaign(
        { title, description, banner, category, rewardPool, organizer, startDate: new Date(startDate), endDate: new Date(endDate), location, latitude, longitude },
        stages as any
      );

      res.status(201).json({ campaign, stages: createdStages });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors.map((e: any) => e.message).join(', ') });
        return;
      }
      res.status(400).json({ error: error.message || 'Failed to create campaign' });
    }
  };

  /**
   * Endpoint: GET /campaigns
   */
  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, status, organizer } = req.query;

      // Extract optional requesting user from Authorization header
      let requestingUserId: string | undefined = undefined;
      let requestingUserRole: string | undefined = undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, config.jwtSecret) as any;
          requestingUserId = decoded.userId;
          requestingUserRole = decoded.role;
        } catch (e) {
          // Ignore invalid tokens, treat as public
        }
      }

      const campaigns = await campaignService.getCampaigns({
        category: category as string,
        status: status as string,
        organizer: organizer as string,
        requestingUserId,
        requestingUserRole,
      });

      res.status(200).json({ campaigns });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint: GET /campaign/:id
   */
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { campaign, stages } = await campaignService.getCampaignById(id);

      // If the campaign is a draft, verify that the requester is the organizer who owns it
      if (campaign.status === 'draft') {
        let isAuthorized = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          try {
            const decoded = jwt.verify(token, config.jwtSecret) as any;
            const orgId = campaign.organizer.toString();
            if (decoded.userId === orgId) {
              isAuthorized = true;
            }
          } catch (e) {
            // Unauthenticated/Invalid Token
          }
        }

        if (!isAuthorized) {
          res.status(403).json({ error: 'Access denied: Draft campaigns are only accessible by their organizer.' });
          return;
        }
      }

      res.status(200).json({ campaign, stages });
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Campaign not found' });
    }
  };

  /**
   * Endpoint: POST /campaign/:id/publish
   */
  public publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { txHash } = req.body;

      if (!txHash) {
        res.status(400).json({ error: 'txHash is required for verification' });
        return;
      }

      const campaign = await campaignService.publishCampaign(id, txHash);
      res.status(200).json({ campaign });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to publish campaign' });
    }
  };

  /**
   * Endpoint: POST /campaign/:id/pause
   */
  public pause = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.pauseCampaign(id);
      res.status(200).json({ campaign });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Endpoint: POST /campaign/:id/resume
   */
  public resume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.resumeCampaign(id);
      res.status(200).json({ campaign });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Endpoint: POST /campaign/:id/cancel
   */
  public cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.cancelCampaign(id);
      res.status(200).json({ campaign });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to cancel campaign' });
    }
  };

  /**
   * Endpoint: GET /campaigns/escrow/address
   */
  public getEscrowAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { config } = await import('../config/environment');
      res.status(200).json({ escrowAddress: config.escrowWalletAddress });
    } catch (error) {
      next(error);
    }
  };
}

export const campaignController = new CampaignController();
