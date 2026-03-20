import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('should have correct API URL configured', () => {
    expect(process.env.NEXT_PUBLIC_API_URL).toBe('http://localhost:4000/api/v1');
  });
});
