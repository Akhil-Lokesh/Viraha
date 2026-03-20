import { Router } from 'express';
import { uploadPhotos, uploadAvatar } from '../controllers/mediaController';
import { authenticate } from '../middleware/auth';
import { upload, uploadSingle } from '../middleware/upload';

const router = Router();

router.post('/upload', authenticate, upload.array('photos', 4), uploadPhotos);
router.post('/avatar', authenticate, uploadSingle.single('avatar'), uploadAvatar);

export default router;
