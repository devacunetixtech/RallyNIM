import { Router } from 'express';
import { passportController } from '../controllers/passport.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Private passport of current authenticated user
router.get('/', authMiddleware, passportController.getMyPassport);

// Public passport lookup
router.get('/:walletAddress', passportController.getPublicPassport);

export default router;
