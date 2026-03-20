import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
router.post('/', authenticate, handleCreateScrapbook);
router.get('/:id', authenticate, handleGetScrapbook);
router.patch('/:id', authenticate, handleUpdateScrapbook);
router.delete('/:id', authenticate, handleDeleteScrapbook);
router.post('/:id/items', authenticate, handleAddScrapbookItem);
router.delete('/items/:itemId', authenticate, handleRemoveScrapbookItem);

export default router;
