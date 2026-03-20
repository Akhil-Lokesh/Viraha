import { Router } from 'express';
import {
  createAlbum,
  getAlbums,
  getAlbumById,
  getAlbumBySlug,
  updateAlbum,
  deleteAlbum,
  addPostToAlbum,
  removePostFromAlbum,
  getAlbumPosts,
} from '../controllers/albumController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createAlbumSchema, updateAlbumSchema, addPostToAlbumSchema } from '../validators/albumValidators';

const router = Router();

router.get('/', optionalAuth, getAlbums);
router.get('/slug/:slug', optionalAuth, getAlbumBySlug);
router.get('/:id', optionalAuth, getAlbumById);
router.post('/', authenticate, validateBody(createAlbumSchema), createAlbum);
router.patch('/:id', authenticate, validateBody(updateAlbumSchema), updateAlbum);
router.delete('/:id', authenticate, deleteAlbum);
router.get('/:id/posts', optionalAuth, getAlbumPosts);
router.post('/:id/posts', authenticate, validateBody(addPostToAlbumSchema), addPostToAlbum);
router.delete('/:id/posts/:postId', authenticate, removePostFromAlbum);

export default router;
