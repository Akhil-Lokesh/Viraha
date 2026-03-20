import { Router } from 'express';
import { getUserByUsername, updateProfile, searchUsers } from '../controllers/userController';
import { followUser, unfollowUser, getFollowers, getFollowing, checkFollowStatus, acceptFollowRequest, rejectFollowRequest, getPendingRequests } from '../controllers/followController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema } from '../validators/userValidators';

const router = Router();

// Specific routes first (must be before parameterized /:username)
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfile);
router.get('/me/follow-requests', authenticate, getPendingRequests);
router.get('/search', optionalAuth, searchUsers);
router.post('/follow-requests/:followId/accept', authenticate, acceptFollowRequest);
router.post('/follow-requests/:followId/reject', authenticate, rejectFollowRequest);

// Parameterized routes
router.get('/:username', optionalAuth, getUserByUsername);
router.post('/:userId/follow', authenticate, followUser);
router.delete('/:userId/follow', authenticate, unfollowUser);
router.get('/:userId/followers', optionalAuth, getFollowers);
router.get('/:userId/following', optionalAuth, getFollowing);
router.get('/:userId/follow/status', authenticate, checkFollowStatus);

export default router;
