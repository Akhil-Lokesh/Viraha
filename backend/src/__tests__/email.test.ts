import { describe, it, expect, vi, afterEach } from 'vitest';
import { env } from '../config/env';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../lib/email';

describe('email delivery', () => {
  const originalKey = env.RESEND_API_KEY;

  afterEach(() => {
    env.RESEND_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it('skips delivery without a Resend key', async () => {
    env.RESEND_API_KEY = undefined;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendPasswordResetEmail('a@example.com', 'tok')).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to the Resend API with the reset link', async () => {
    env.RESEND_API_KEY = 're_test_key';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendPasswordResetEmail('a@example.com', 'tok123')).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key');
    const body = JSON.parse(init.body as string) as { to: string; html: string };
    expect(body.to).toBe('a@example.com');
    expect(body.html).toContain('/reset-password?token=tok123');
  });

  it('escapes user-controlled text in the HTML', async () => {
    env.RESEND_API_KEY = 're_test_key';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await sendWelcomeEmail('a@example.com', '<script>x</script>');

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string) as { html: string };
    expect(body.html).not.toContain('<script>');
  });

  it('reports failure when Resend rejects the request', async () => {
    env.RESEND_API_KEY = 're_test_key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422 }));

    await expect(sendWelcomeEmail('a@example.com', 'nina')).resolves.toBe(false);
  });
});
