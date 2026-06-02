import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createTimeCapsuleSchema } from '../validators/timeCapsuleValidators';
import {
  handleGetTimeCapsules,
  handleCreateTimeCapsule,
  handleOpenTimeCapsule,
} from '../controllers/timeCapsuleController';

const router = Router();

router.get('/', authenticate, handleGetTimeCapsules);
router.post('/', authenticate, validateBody(createTimeCapsuleSchema), handleCreateTimeCapsule);
router.post('/:id/open', authenticate, handleOpenTimeCapsule);

export default router;
