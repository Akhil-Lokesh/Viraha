import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getUserByUsername, updateProfile, searchUsers } from '../controllers/userController';
import { followUser, unfollowUser, getFollowers, getFollowing, checkFollowStatus, acceptFollowRequest, rejectFollowRequest, getPendingRequests } from '../controllers/followController';
import { blockUser, unblockUser, getBlockedUsers } from '../controllers/blockController';
import { handleExportData, handleDeleteAccount } from '../controllers/dataExportController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema, deleteAccountSchema } from '../validators/userValidators';

const router = Router();

// Strict limiter for full-account data exports (expensive full-DB dumps)
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Export limit reached, please try again later.' },
  },
});

// Specific routes first (must be before parameterized /:username)
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfile);
router.get('/me/follow-requests', authenticate, getPendingRequests);
router.get('/me/blocks', authenticate, getBlockedUsers);
router.post('/me/export', authenticate, exportLimiter, handleExportData);
router.delete('/me', authenticate, validateBody(deleteAccountSchema), handleDeleteAccount);
router.get('/search', optionalAuth, searchUsers);
router.post('/follow-requests/:followId/accept', authenticate, acceptFollowRequest);
router.post('/follow-requests/:followId/reject', authenticate, rejectFollowRequest);

// Parameterized routes
router.get('/:username', optionalAuth, getUserByUsername);
router.post('/:userId/follow', authenticate, followUser);
router.delete('/:userId/follow', authenticate, unfollowUser);
router.post('/:userId/block', authenticate, blockUser);
router.delete('/:userId/block', authenticate, unblockUser);
router.get('/:userId/followers', optionalAuth, getFollowers);
router.get('/:userId/following', optionalAuth, getFollowing);
router.get('/:userId/follow/status', authenticate, checkFollowStatus);

export default router;
