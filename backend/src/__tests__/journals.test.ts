import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestJournal, createTestJournalEntry, getAuthCookie } from './factories';

describe('Journals API', () => {
  describe('POST /api/v1/journals', () => {
    it('should create a journal', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post('/api/v1/journals')
        .set('Cookie', cookie)
        .send({ title: 'My Trip' });

      expect(res.status).toBe(201);
      expect(res.body.data.journal.title).toBe('My Trip');
      expect(res.body.data.journal.status).toBe('draft');
    });
  });

  describe('GET /api/v1/journals', () => {
    it('should only show published public journals to unauthenticated', async () => {
      const user = await createTestUser();
      await createTestJournal(user.id, { status: 'published', privacy: 'public' });
      await createTestJournal(user.id, { status: 'draft', privacy: 'public' });

      const res = await request(app).get('/api/v1/journals');

      expect(res.status).toBe(200);
      const drafts = res.body.data.items.filter((j: any) => j.status === 'draft');
      expect(drafts.length).toBe(0);
    });
  });

  describe('POST /api/v1/journals/:id/publish', () => {
    it('should publish a journal with entries', async () => {
      const user = await createTestUser();
      const journal = await createTestJournal(user.id);
      await createTestJournalEntry(journal.id);
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post(`/api/v1/journals/${journal.id}/publish`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.journal.status).toBe('published');
      expect(res.body.data.journal.publishedAt).toBeTruthy();
    });

    it('should reject publishing empty journal', async () => {
      const user = await createTestUser();
      const journal = await createTestJournal(user.id);
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post(`/api/v1/journals/${journal.id}/publish`)
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('should reject publishing by non-owner', async () => {
      const owner = await createTestUser();
      const other = await createTestUser();
      const journal = await createTestJournal(owner.id);
      await createTestJournalEntry(journal.id);
      const cookie = getAuthCookie(other.id);

      const res = await request(app)
        .post(`/api/v1/journals/${journal.id}/publish`)
        .set('Cookie', cookie);

      expect(res.status).toBe(403);
    });
  });

  describe('Journal Entries', () => {
    it('should create an entry and update word count', async () => {
      const user = await createTestUser();
      const journal = await createTestJournal(user.id);
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post(`/api/v1/journals/${journal.id}/entries`)
        .set('Cookie', cookie)
        .send({ title: 'Day 1', content: 'We arrived in Tokyo today and it was amazing.' });

      expect(res.status).toBe(201);
      expect(res.body.data.entry.title).toBe('Day 1');

      // Verify word count was updated
      const journalRes = await request(app)
        .get(`/api/v1/journals/${journal.id}`)
        .set('Cookie', cookie);
      expect(journalRes.body.data.journal.wordCount).toBeGreaterThan(0);
    });

    it('should list entries ordered by sortOrder', async () => {
      const user = await createTestUser();
      const journal = await createTestJournal(user.id);
      await createTestJournalEntry(journal.id, { sortOrder: 1, title: 'Second' });
      await createTestJournalEntry(journal.id, { sortOrder: 0, title: 'First' });
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .get(`/api/v1/journals/${journal.id}/entries`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].title).toBe('First');
      expect(res.body.data.items[1].title).toBe('Second');
    });

    it('should soft delete an entry', async () => {
      const user = await createTestUser();
      const journal = await createTestJournal(user.id);
      const entry = await createTestJournalEntry(journal.id);
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .delete(`/api/v1/journals/${journal.id}/entries/${entry.id}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
    });
  });
});
