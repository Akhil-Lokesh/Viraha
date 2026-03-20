import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  handleGetOnThisDay,
  handleGetMoments,
  handleDismissMoment,
  handleGetPlaceHistory,
  handleGetPlaceResonance,
  handleGetPlaceNote,
  handleUpsertPlaceNote,
} from '../controllers/virahaController';

const router = Router();

// Memory resurfacing
router.get('/on-this-day', authenticate, handleGetOnThisDay);
router.get('/moments', authenticate, handleGetMoments);
router.patch('/moments/:id/dismiss', authenticate, handleDismissMoment);

// Place history & resonance
router.get('/places/history', authenticate, handleGetPlaceHistory);
router.get('/places/resonance', authenticate, handleGetPlaceResonance);

// Place notes (private)
router.get('/places/note', authenticate, handleGetPlaceNote);
router.put('/places/note', authenticate, handleUpsertPlaceNote);

export default router;
