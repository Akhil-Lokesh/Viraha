import { describe, it, expect } from 'vitest';
import { registerSchema } from '../validators/authValidators';
import { createPostSchema } from '../validators/postValidators';
import { createAlbumSchema } from '../validators/albumValidators';
import { createJournalSchema, createJournalEntrySchema } from '../validators/journalValidators';

describe('Validators', () => {
  describe('registerSchema', () => {
    it('should accept valid input', () => {
      const result = registerSchema.safeParse({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = registerSchema.safeParse({
        username: 'testuser',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        username: 'testuser',
        email: 'test@test.com',
        password: '123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject too-long username', () => {
      const result = registerSchema.safeParse({
        username: 'a'.repeat(31),
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createPostSchema', () => {
    it('should accept valid post data', () => {
      const result = createPostSchema.safeParse({
        mediaUrls: ['https://example.com/photo.jpg'],
        locationLat: 40.7128,
        locationLng: -74.006,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid latitude', () => {
      const result = createPostSchema.safeParse({
        mediaUrls: ['https://example.com/photo.jpg'],
        locationLat: 100,
        locationLng: -74.006,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createAlbumSchema', () => {
    it('should accept valid album with dates', () => {
      const result = createAlbumSchema.safeParse({
        title: 'My Album',
        startDate: '2024-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = createAlbumSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('createJournalSchema', () => {
    it('should accept valid journal', () => {
      const result = createJournalSchema.safeParse({ title: 'My Trip' });
      expect(result.success).toBe(true);
    });

    it('should reject too-long title', () => {
      const result = createJournalSchema.safeParse({ title: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });
  });

  describe('createJournalEntrySchema', () => {
    it('should accept valid entry', () => {
      const result = createJournalEntrySchema.safeParse({
        title: 'Day 1',
        content: 'We arrived today.',
      });
      expect(result.success).toBe(true);
    });

    it('should reject too-long content', () => {
      const result = createJournalEntrySchema.safeParse({
        content: 'a'.repeat(50001),
      });
      expect(result.success).toBe(false);
    });
  });
});
