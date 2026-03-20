import { Router } from 'express';
import { getPersonalizedFeed, getDiscoverFeed } from '../controllers/feedController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getPersonalizedFeed);
router.get('/discover', optionalAuth, getDiscoverFeed);

export default router;
