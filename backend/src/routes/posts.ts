import { Router } from 'express';
import { getPosts, getPostById, searchPosts, createPost, updatePost, deletePost } from '../controllers/postController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createPostSchema, updatePostSchema } from '../validators/postValidators';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', optionalAuth, getPosts);
router.get('/search', searchLimiter, optionalAuth, searchPosts);
router.get('/:id', optionalAuth, getPostById);
router.post('/', authenticate, validateBody(createPostSchema), createPost);
router.patch('/:id', authenticate, validateBody(updatePostSchema), updatePost);
router.delete('/:id', authenticate, deletePost);

export default router;
