import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  handleGetTimeCapsules,
  handleCreateTimeCapsule,
  handleOpenTimeCapsule,
} from '../controllers/timeCapsuleController';

const router = Router();

router.get('/', authenticate, handleGetTimeCapsules);
router.post('/', authenticate, handleCreateTimeCapsule);
router.post('/:id/open', authenticate, handleOpenTimeCapsule);

export default router;
