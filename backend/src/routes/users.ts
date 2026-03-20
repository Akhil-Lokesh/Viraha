import { Router } from 'express';
import { getUserByUsername, updateProfile, searchUsers } from '../controllers/userController';
import { followUser, unfollowUser, getFollowers, getFollowing, checkFollowStatus, acceptFollowRequest, rejectFollowRequest, getPendingRequests } from '../controllers/followController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema } from '../validators/userValidators';

const router = Router();

// Specific routes first
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfile);
router.get('/search', optionalAuth, searchUsers);

// Parameterized routes
router.get('/:username', optionalAuth, getUserByUsername);
router.post('/:userId/follow', authenticate, followUser);
router.delete('/:userId/follow', authenticate, unfollowUser);
router.get('/:userId/followers', optionalAuth, getFollowers);
router.get('/:userId/following', optionalAuth, getFollowing);
router.get('/:userId/follow/status', authenticate, checkFollowStatus);
router.get('/me/follow-requests', authenticate, getPendingRequests);
router.post('/follow-requests/:followId/accept', authenticate, acceptFollowRequest);
router.post('/follow-requests/:followId/reject', authenticate, rejectFollowRequest);

export default router;
