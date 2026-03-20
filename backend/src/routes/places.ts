import { Router } from 'express';
import { autocomplete, getDetails } from '../controllers/placesController';
import { authenticate } from '../middleware/auth';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/autocomplete', searchLimiter, authenticate, autocomplete);
router.get('/:placeId', authenticate, getDetails);

export default router;
