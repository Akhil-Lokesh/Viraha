import { Router } from 'express';
import { createComment, getComments, getReplies, updateComment, deleteComment } from '../controllers/commentController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createCommentSchema, updateCommentSchema } from '../validators/commentValidators';

const router = Router();

// Post comments
router.post('/posts/:postId/comments', authenticate, validateBody(createCommentSchema), createComment);
router.get('/posts/:postId/comments', optionalAuth, getComments);

// Comment operations
router.get('/comments/:commentId/replies', optionalAuth, getReplies);
router.patch('/comments/:commentId', authenticate, validateBody(updateCommentSchema), updateComment);
router.delete('/comments/:commentId', authenticate, deleteComment);

export default router;
