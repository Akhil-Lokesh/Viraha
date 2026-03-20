import { env } from '../config/env';
import { logger } from './logger';

let resend: any = null;

async function getResend() {
  if (resend) return resend;
  if (!env.RESEND_API_KEY) return null;
  try {
    // Dynamic import for optional dependency — resend may not be installed
    const mod = await (Function('return import("resend")')() as Promise<any>);
    resend = new mod.Resend(env.RESEND_API_KEY);
    return resend;
  } catch {
    return null;
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
  const client = await getResend();

  if (!client) {
    logger.debug('Password reset email delivery skipped (no Resend client)');
    return false;
  }

  try {
    await client.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: 'Reset your Viraha password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Reset your password</h2>
          <p style="color: #666;">Click the link below to reset your Viraha password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to send password reset email');
    return false;
  }
}

export async function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
  const client = await getResend();

  if (!client) {
    logger.debug({ to, username }, 'Welcome email delivery skipped (no Resend client)');
    return false;
  }

  try {
    await client.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: 'Welcome to Viraha',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Welcome to Viraha, ${username}!</h2>
          <p style="color: #666;">Your travel memory collection starts now. Start documenting your adventures and discover authentic places through your network.</p>
          <a href="${env.CORS_ORIGIN}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Start Exploring
          </a>
          <p style="color: #999; font-size: 12px;">Keep your travels alive.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to send welcome email');
    return false;
  }
}
