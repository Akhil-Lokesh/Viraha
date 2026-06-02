import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createWantToGoSchema,
  updateWantToGoSchema,
} from '../validators/wantToGoValidators';
import {
  handleGetWantToGo,
  handleCreateWantToGo,
  handleUpdateWantToGo,
  handleDeleteWantToGo,
} from '../controllers/wantToGoController';

const router = Router();

router.get('/', authenticate, handleGetWantToGo);
router.post('/', authenticate, validateBody(createWantToGoSchema), handleCreateWantToGo);
router.patch('/:id', authenticate, validateBody(updateWantToGoSchema), handleUpdateWantToGo);
router.delete('/:id', authenticate, handleDeleteWantToGo);

export default router;
