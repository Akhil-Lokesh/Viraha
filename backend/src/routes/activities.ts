import { Router } from 'express';
import { getActivities, markAsRead, markAllAsRead, getUnreadCount } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getActivities);
router.get('/unread', authenticate, getUnreadCount);
router.patch('/read-all', authenticate, markAllAsRead);
router.patch('/:id/read', authenticate, markAsRead);

export default router;
