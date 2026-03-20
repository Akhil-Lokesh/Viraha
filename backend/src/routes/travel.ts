import { Router } from 'express';
import { getTravelMode, updateTravelMode, getNearbyFeed } from '../controllers/travelController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateTravelModeSchema } from '../validators/travelValidators';

const router = Router();

router.get('/mode', authenticate, getTravelMode);
router.put('/mode', authenticate, validateBody(updateTravelModeSchema), updateTravelMode);
router.get('/nearby', authenticate, getNearbyFeed);

export default router;
