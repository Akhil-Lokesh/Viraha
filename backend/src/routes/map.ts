import { Router } from 'express';
import { getMapMarkers } from '../controllers/mapController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/markers', optionalAuth, getMapMarkers);

export default router;
