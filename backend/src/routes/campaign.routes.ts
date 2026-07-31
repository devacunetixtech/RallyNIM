import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', campaignController.list);
router.get('/escrow/address', campaignController.getEscrowAddress);
router.get('/:id', campaignController.getById);

// Protected routes (Organizer only)
router.post(
  '/', 
  authMiddleware, 
  requireRole(['organizer']), 
  campaignController.create
);
router.post(
  '/:id/publish', 
  authMiddleware, 
  requireRole(['organizer']), 
  campaignController.publish
);
router.post(
  '/:id/pause', 
  authMiddleware, 
  requireRole(['organizer']), 
  campaignController.pause
);
router.post(
  '/:id/resume', 
  authMiddleware, 
  requireRole(['organizer']), 
  campaignController.resume
);
router.post(
  '/:id/cancel', 
  authMiddleware, 
  requireRole(['organizer']), 
  campaignController.cancel
);

export default router;
