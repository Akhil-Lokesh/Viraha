import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  handleGetJourneys,
  handleGetJourney,
  handleUpdateJourney,
  handleConfirmJourney,
  handleDeleteJourney,
  handleDetectJourneys,
} from '../controllers/journeyController';

const router = Router();

router.get('/', authenticate, handleGetJourneys);
router.post('/detect', authenticate, handleDetectJourneys);
router.get('/:id', authenticate, handleGetJourney);
router.patch('/:id', authenticate, handleUpdateJourney);
router.post('/:id/confirm', authenticate, handleConfirmJourney);
router.delete('/:id', authenticate, handleDeleteJourney);

export default router;
