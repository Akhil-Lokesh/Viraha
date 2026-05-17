import { Router } from 'express';
import { streamNotifications } from '../controllers/notificationStreamController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stream', authenticate, streamNotifications);

export default router;
