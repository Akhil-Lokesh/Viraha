import { Router } from 'express';
import { getTrendingLocations, getTrendingTags, getFeaturedContent } from '../controllers/exploreController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/trending-locations', optionalAuth, getTrendingLocations);
router.get('/trending-tags', optionalAuth, getTrendingTags);
router.get('/featured', optionalAuth, getFeaturedContent);

export default router;
