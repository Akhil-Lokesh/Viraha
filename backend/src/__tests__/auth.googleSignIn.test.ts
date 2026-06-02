import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestUser, prisma } from './factories';

// Mock google-auth-library BEFORE importing the app so the controller picks up the mock.
const verifyIdToken = vi.fn();

vi.mock('google-auth-library', () => {
  // Use a class so `new OAuth2Client()` is always a valid constructor — a
  // vi.fn().mockImplementation arrow is not reliably newable after vi.resetModules().
  return {
    OAuth2Client: class {
      verifyIdToken = verifyIdToken;
    },
  };
});

const ORIGINAL_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

describe('Google sign-in', () => {
  let app: typeof import('../app').default;

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    // Reset module cache so the controller re-initialises the OAuth2Client with the env var
    vi.resetModules();
    const mod = await import('../app');
    app = mod.default;
    verifyIdToken.mockReset();
  });

  afterEach(() => {
    if (ORIGINAL_CLIENT_ID === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = ORIGINAL_CLIENT_ID;
  });

  function mockTicket(payload: Record<string, unknown>) {
    verifyIdToken.mockResolvedValueOnce({
      getPayload: () => payload,
    });
  }

  it('creates a new user when Google returns a previously-unseen sub', async () => {
    mockTicket({
      sub: 'google-sub-123',
      email: 'newcomer@example.com',
      email_verified: true,
      name: 'Newcomer User',
      picture: 'https://lh3.googleusercontent.com/a/avatar',
    });

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'fake-id-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('newcomer@example.com');

    const user = await prisma.user.findUnique({ where: { googleId: 'google-sub-123' } });
    expect(user).not.toBeNull();
    expect(user!.emailVerified).toBe(true);
    expect(user!.authProvider).toBe('google');
  });

  it('links an existing local account when Google reports email_verified=true', async () => {
    const existing = await createTestUser({ email: 'linkme@example.com', emailVerified: false });
    mockTicket({
      sub: 'google-sub-link',
      email: 'linkme@example.com',
      email_verified: true,
      name: 'Linked User',
    });

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'fake-id-token' });

    expect(res.status).toBe(200);

    const after = await prisma.user.findUnique({ where: { id: existing.id } });
    expect(after!.googleId).toBe('google-sub-link');
    expect(after!.emailVerified).toBe(true);
  });

  it('rejects linking when Google reports email_verified=false', async () => {
    await createTestUser({ email: 'unverified@example.com' });
    mockTicket({
      sub: 'google-sub-unverified',
      email: 'unverified@example.com',
      email_verified: false,
      name: 'No Verify',
    });

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'fake-id-token' });

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe('EMAIL_IN_USE');
  });

  it('returns the same user on subsequent sign-ins via googleId lookup', async () => {
    mockTicket({
      sub: 'google-sub-repeat',
      email: 'repeat@example.com',
      email_verified: true,
      name: 'Repeat User',
    });
    const first = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'fake-id-token' });
    expect(first.status).toBe(200);
    const firstId = first.body.data.user.id;

    mockTicket({
      sub: 'google-sub-repeat',
      email: 'repeat@example.com',
      email_verified: true,
      name: 'Repeat User',
    });
    const second = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'fake-id-token' });
    expect(second.status).toBe(200);
    expect(second.body.data.user.id).toBe(firstId);

    const countByGoogleId = await prisma.user.count({ where: { googleId: 'google-sub-repeat' } });
    expect(countByGoogleId).toBe(1);
  });

  it('returns 401 when token verification throws', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('bad token'));

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'fake-id-token' });

    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe('INVALID_TOKEN');
  });

  it('returns 503 GOOGLE_OAUTH_DISABLED when GOOGLE_CLIENT_ID is unset', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    vi.resetModules();
    const mod = await import('../app');
    const localApp = mod.default;

    const res = await request(localApp)
      .post('/api/v1/auth/google')
      .send({ idToken: 'fake-id-token' });

    expect(res.status).toBe(503);
    expect(res.body.error?.code).toBe('GOOGLE_OAUTH_DISABLED');
  });
});
