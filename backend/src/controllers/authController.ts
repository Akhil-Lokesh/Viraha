import { Request, Response, NextFunction } from 'express';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { randomBytes } from 'crypto';
import { env } from '../config/env';
import { RegisterInput, LoginInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput, VerifyEmailInput, GoogleSignInInput } from '../validators/authValidators';
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail } from '../lib/email';
import { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies } from '../utils/cookies';

let googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client | null {
  if (!env.GOOGLE_CLIENT_ID) return null;
  if (googleClient) return googleClient;
  googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  return googleClient;
}

async function generateUniqueUsername(seed: string): Promise<string> {
  // Sanitize and clamp seed to ~24 chars, leaving headroom for a random suffix
  const cleaned = seed.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) || 'user';
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = attempt === 0 ? '' : `_${randomBytes(3).toString('hex')}`;
    const candidate = `${cleaned}${suffix}`.slice(0, 30);
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
  }
  // Fall back to a fully random username
  return `user_${randomBytes(8).toString('hex')}`;
}

function sanitizeUser<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

function sessionMetadata(req: Request): { userAgent: string | null; ip: string | null } {
  return {
    userAgent: req.get('user-agent')?.slice(0, 512) ?? null,
    ip: req.ip ?? null,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, displayName } = req.body as RegisterInput;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existing) {
      const field = existing.username === username ? 'username' : 'email';
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: `A user with this ${field} already exists` },
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: displayName || username,
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ...sessionMetadata(req),
      },
    });

    // Issue email verification token (fire-and-forget delivery)
    const verificationToken = randomBytes(32).toString('hex');
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send welcome + verification emails (fire-and-forget)
    sendWelcomeEmail(email, username).catch(() => {});
    sendVerificationEmail(email, verificationToken).catch(() => {});

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Account has been deactivated' },
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ...sessionMetadata(req),
      },
    });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { user: sanitizeUser(user) },
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.viraha_refresh;

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
      });
      return;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' },
      });
      return;
    }

    try {
      verifyRefreshToken(token);
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' },
      });
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => {});
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: { isActive: true },
    });

    if (!user) {
      // Token's user no longer exists (hard-deleted). Treat exactly like an
      // invalid token — 401, not 403 — so we don't reveal the account existed.
      await prisma.refreshToken.deleteMany({ where: { userId: storedToken.userId } });
      clearAuthCookies(res);
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' },
      });
      return;
    }

    if (!user.isActive) {
      await prisma.refreshToken.deleteMany({ where: { userId: storedToken.userId } });
      clearAuthCookies(res);
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Account is deactivated' },
      });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const accessToken = generateAccessToken(storedToken.userId);
    const newRefreshToken = generateRefreshToken(storedToken.userId);

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
        ...sessionMetadata(req),
      },
    });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: { message: 'Token refreshed' },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.viraha_refresh;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: req.user
          ? { token: refreshToken, userId: req.user.userId }
          : { token: refreshToken },
      });
    }

    clearAuthCookies(res);

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
      });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens to force re-login on other devices
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    res.json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as ForgotPasswordInput;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        success: true,
        data: { message: 'If an account with that email exists, a reset link has been sent.' },
      });
      return;
    }

    // Invalidate any existing reset tokens for this user
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await sendPasswordResetEmail(email, token);

    res.json({
      success: true,
      data: { message: 'If an account with that email exists, a reset link has been sent.' },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body as VerifyEmailInput;

    const record = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'This verification link is invalid or has expired.' },
      });
      return;
    }

    if (record.user.emailVerified) {
      await prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      res.json({
        success: true,
        data: { message: 'Email already verified.' },
      });
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({
      success: true,
      data: { message: 'Email verified successfully.' },
    });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    if (user.emailVerified) {
      res.json({
        success: true,
        data: { message: 'Email already verified.' },
      });
      return;
    }

    // Invalidate any existing verification tokens for this user
    await prisma.emailVerification.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, token);

    res.json({
      success: true,
      data: { message: 'Verification email sent.' },
    });
  } catch (err) {
    next(err);
  }
}

export async function googleSignIn(req: Request, res: Response, next: NextFunction) {
  try {
    const client = getGoogleClient();
    if (!client) {
      res.status(503).json({
        success: false,
        error: { code: 'GOOGLE_OAUTH_DISABLED', message: 'Google sign-in is not configured on this server.' },
      });
      return;
    }

    const { idToken } = req.body as GoogleSignInInput;

    let payload: TokenPayload | undefined;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Could not verify Google identity token.' },
      });
      return;
    }

    if (!payload || !payload.sub || !payload.email) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Google token did not return required fields.' },
      });
      return;
    }

    const { sub: googleId, email, email_verified: emailVerified, name, picture } = payload;

    // Look up by Google ID first
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      // Try to link to an existing local account by email — only if Google has
      // verified the email. Otherwise reject to prevent takeover.
      const existingByEmail = await prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        if (!emailVerified) {
          res.status(409).json({
            success: false,
            error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists.' },
          });
          return;
        }
        // Link
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId,
            authProvider: existingByEmail.authProvider ?? 'google',
            emailVerified: true,
            ...(picture && !existingByEmail.avatar ? { avatar: picture } : {}),
          },
        });
      } else {
        // Brand new user
        const username = await generateUniqueUsername(
          (name as string | undefined) ?? email.split('@')[0],
        );
        const passwordHash = await hashPassword(randomBytes(32).toString('hex'));
        user = await prisma.user.create({
          data: {
            username,
            email,
            passwordHash,
            displayName: (name as string | undefined) ?? username,
            avatar: picture ?? null,
            googleId,
            authProvider: 'google',
            emailVerified: !!emailVerified,
          },
        });

        sendWelcomeEmail(email, username).catch(() => {});
      }
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Account has been deactivated' },
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ...sessionMetadata(req),
      },
    });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      data: { user: sanitizeUser(user) },
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body as ResetPasswordInput;

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'This reset link is invalid or has expired.' },
      });
      return;
    }

    const newHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    res.json({
      success: true,
      data: { message: 'Password has been reset successfully. Please log in with your new password.' },
    });
  } catch (err) {
    next(err);
  }
}

export async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const currentRefreshToken = req.cookies?.viraha_refresh as string | undefined;

    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId: req.user!.userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    const sessions = tokens.map((t) => ({
      id: t.id,
      userAgent: t.userAgent,
      ip: t.ip,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
      current: currentRefreshToken !== undefined && t.token === currentRefreshToken,
    }));

    res.json({
      success: true,
      data: { sessions },
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(req: Request, res: Response, next: NextFunction) {
  try {
    const rawId = req.params.id;
    const id = typeof rawId === 'string' ? rawId : '';

    // Non-UUID ids can never match a session row; short-circuit so Postgres
    // does not error on invalid uuid input.
    if (!id || !UUID_REGEX.test(id)) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
      return;
    }

    // Scoping by userId guarantees a user can only revoke their own sessions.
    const result = await prisma.refreshToken.deleteMany({
      where: { id, userId: req.user!.userId },
    });

    if (result.count === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { message: 'Session revoked' },
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeOtherSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const currentRefreshToken = req.cookies?.viraha_refresh as string | undefined;

    const result = await prisma.refreshToken.deleteMany({
      where: {
        userId: req.user!.userId,
        ...(currentRefreshToken ? { token: { not: currentRefreshToken } } : {}),
      },
    });

    res.json({
      success: true,
      data: { revoked: result.count },
    });
  } catch (err) {
    next(err);
  }
}
