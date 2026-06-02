import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createScrapbookSchema,
  updateScrapbookSchema,
  addScrapbookItemSchema,
} from '../validators/scrapbookValidators';
import {
  handleGetScrapbooks,
  handleGetScrapbook,
  handleCreateScrapbook,
  handleUpdateScrapbook,
  handleDeleteScrapbook,
  handleAddScrapbookItem,
  handleRemoveScrapbookItem,
} from '../controllers/scrapbookController';

const router = Router();

router.get('/', authenticate, handleGetScrapbooks);
router.post('/', authenticate, validateBody(createScrapbookSchema), handleCreateScrapbook);
router.get('/:id', authenticate, handleGetScrapbook);
router.patch('/:id', authenticate, validateBody(updateScrapbookSchema), handleUpdateScrapbook);
router.delete('/:id', authenticate, handleDeleteScrapbook);
router.post('/:id/items', authenticate, validateBody(addScrapbookItemSchema), handleAddScrapbookItem);
router.delete('/items/:itemId', authenticate, handleRemoveScrapbookItem);

export default router;
