import { env } from '../config/env';
import { logger } from './logger';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const REQUEST_TIMEOUT_MS = 10_000;
const BRAND_ACCENT = '#7B68EE';

interface Email {
  to: string;
  subject: string;
  heading: string;
  body: string;
  action: { label: string; url: string };
  footnote: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function renderEmail({ heading, body, action, footnote }: Email): string {
  return `
    <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin: 0 0 12px;">${escapeHtml(heading)}</h2>
      <p style="color: #555; line-height: 1.5;">${escapeHtml(body)}</p>
      <a href="${escapeHtml(action.url)}" style="display: inline-block; padding: 12px 24px; background: ${BRAND_ACCENT}; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        ${escapeHtml(action.label)}
      </a>
      <p style="color: #999; font-size: 12px;">${escapeHtml(footnote)}</p>
    </div>`;
}

/**
 * Send through Resend's HTTP API. Returns false (never throws) when delivery
 * is not configured or fails. In local development without a key, the action
 * link is logged so verification/reset flows stay testable.
 */
async function sendEmail(email: Email): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === 'development') {
      logger.info({ subject: email.subject, link: email.action.url }, 'Email delivery not configured — dev link');
    } else {
      logger.warn({ subject: email.subject }, 'Email not sent: RESEND_API_KEY is not configured');
    }
    return false;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: email.to,
        subject: email.subject,
        html: renderEmail(email),
      }),
    });
    if (!response.ok) {
      logger.error({ status: response.status, subject: email.subject }, 'Resend rejected email');
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err, subject: email.subject }, 'Failed to send email');
    return false;
  }
}

export function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Reset your Viraha password',
    heading: 'Reset your password',
    body: 'Click the link below to reset your Viraha password. This link expires in 1 hour.',
    action: { label: 'Reset Password', url: `${env.CORS_ORIGIN}/reset-password?token=${token}` },
    footnote: "If you didn't request this, you can ignore this email.",
  });
}

export function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Verify your Viraha email',
    heading: 'Verify your email',
    body: 'Click the link below to verify your Viraha email address. This link expires in 24 hours.',
    action: { label: 'Verify Email', url: `${env.CORS_ORIGIN}/verify-email?token=${token}` },
    footnote: "If you didn't sign up for Viraha, you can ignore this email.",
  });
}

export function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Welcome to Viraha',
    heading: `Welcome to Viraha, ${username}!`,
    body: 'Your travel memory collection starts now. Start documenting your adventures and discover authentic places through your network.',
    action: { label: 'Start Exploring', url: env.CORS_ORIGIN },
    footnote: 'Keep your travels alive.',
  });
}
