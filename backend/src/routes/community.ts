import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { handleGetPlaceStories, handleGetKindredTravelers } from '../controllers/placeStoriesController';

const router = Router();

router.get('/place-stories', optionalAuth, handleGetPlaceStories);
router.get('/kindred', authenticate, handleGetKindredTravelers);

export default router;
