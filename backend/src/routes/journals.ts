import { Router } from 'express';
import {
  createJournal,
  getJournals,
  getJournalById,
  getJournalBySlug,
  updateJournal,
  deleteJournal,
  publishJournal,
  createEntry,
  getEntries,
  updateEntry,
  deleteEntry,
} from '../controllers/journalController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createJournalSchema,
  updateJournalSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
} from '../validators/journalValidators';

const router = Router();

router.post('/', authenticate, validateBody(createJournalSchema), createJournal);
router.get('/', optionalAuth, getJournals);
router.get('/slug/:slug', optionalAuth, getJournalBySlug);
router.get('/:id', optionalAuth, getJournalById);
router.put('/:id', authenticate, validateBody(updateJournalSchema), updateJournal);
router.post('/:id/publish', authenticate, publishJournal);
router.delete('/:id', authenticate, deleteJournal);

router.post('/:id/entries', authenticate, validateBody(createJournalEntrySchema), createEntry);
router.get('/:id/entries', optionalAuth, getEntries);
router.put('/:id/entries/:entryId', authenticate, validateBody(updateJournalEntrySchema), updateEntry);
router.delete('/:id/entries/:entryId', authenticate, deleteEntry);

export default router;
