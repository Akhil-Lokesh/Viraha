import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createReportSchema } from '../validators/reportValidators';

const router = Router();

// Stricter limiter to curb report abuse / spam
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many reports, please try again later.' },
  },
});

router.post('/', authenticate, reportLimiter, validateBody(createReportSchema), createReport);

export default router;
