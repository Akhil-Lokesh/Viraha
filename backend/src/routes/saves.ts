import { Router } from 'express';
import { toggleSave, checkSaveStatus, getSavedPosts } from '../controllers/saveController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/posts/:postId/save', authenticate, toggleSave);
router.get('/posts/:postId/save', authenticate, checkSaveStatus);
router.get('/saves', authenticate, getSavedPosts);

export default router;
