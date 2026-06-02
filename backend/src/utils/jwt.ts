import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: 'access' } as TokenPayload, env.JWT_SECRET, {
    expiresIn: '15m',
  });
}

export function generateRefreshToken(userId: string): string {
  // A unique jti makes every refresh token distinct even when two are minted in
  // the same second (rotation, parallel logins). The token is stored by value
  // with a UNIQUE constraint, so without this they would collide (P2002).
  return jwt.sign({ userId, type: 'refresh' } as TokenPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    jwtid: randomUUID(),
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}
