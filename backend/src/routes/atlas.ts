import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { handleGetAtlas, handleGetSeasonalReflection } from '../controllers/atlasController';

const router = Router();

router.get('/', authenticate, handleGetAtlas);
router.get('/seasonal', authenticate, handleGetSeasonalReflection);

export default router;
