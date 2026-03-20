import { Router } from 'express';
import { register, login, me, refreshTokenHandler, logout, changePassword, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidators';
import { generateCsrfToken } from '../middleware/csrf';

const router = Router();

router.get('/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ success: true, data: { csrfToken: token } });
});

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, me);
router.post('/refresh', validateBody(refreshTokenSchema), refreshTokenHandler);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

export default router;
