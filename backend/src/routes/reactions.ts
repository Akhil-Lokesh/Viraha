import { Router } from 'express';
import { toggleLike } from '../controllers/reactionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/posts/:postId/like', authenticate, toggleLike);

export default router;
