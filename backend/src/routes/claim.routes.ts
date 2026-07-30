import { Router } from 'express';
import { claimController } from '../controllers/claim.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

import { claimRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Participant and Organizer routes (Protected)
router.post('/claim', authMiddleware, claimRateLimiter, claimController.claim);
router.get('/history', authMiddleware, claimController.history);
router.get('/organizer/history', authMiddleware, requireRole(['organizer']), claimController.organizerHistory);

// Dynamic QR generation (Organizer only)
router.post(
  '/qr/generate', 
  authMiddleware, 
  requireRole(['organizer']), 
  claimController.generateQr
);

export default router;
