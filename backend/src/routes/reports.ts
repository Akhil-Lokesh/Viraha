import { Router } from 'express';
import { createReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createReportSchema } from '../validators/reportValidators';

const router = Router();

router.post('/', authenticate, validateBody(createReportSchema), createReport);

export default router;
