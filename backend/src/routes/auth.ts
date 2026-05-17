import { Router } from 'express';
import { register, login, me, refreshTokenHandler, logout, changePassword, forgotPassword, resetPassword, verifyEmail, resendVerification, googleSignIn } from '../controllers/authController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, googleSignInSchema } from '../validators/authValidators';
import { generateCsrfToken } from '../middleware/csrf';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ success: true, data: { csrfToken: token } });
});

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, me);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', optionalAuth, logout);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
router.post('/verify-email', validateBody(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', authLimiter, authenticate, resendVerification);
router.post('/google', authLimiter, validateBody(googleSignInSchema), googleSignIn);

export default router;
