import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  handleGetWantToGo,
  handleCreateWantToGo,
  handleUpdateWantToGo,
  handleDeleteWantToGo,
} from '../controllers/wantToGoController';

const router = Router();

router.get('/', authenticate, handleGetWantToGo);
router.post('/', authenticate, handleCreateWantToGo);
router.patch('/:id', authenticate, handleUpdateWantToGo);
router.delete('/:id', authenticate, handleDeleteWantToGo);

export default router;
