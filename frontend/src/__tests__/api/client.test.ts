import { describe, it, expect } from 'vitest';
import apiClient from '../../lib/api/client';

describe('API Client', () => {
  it('should have withCredentials enabled', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('should have correct baseURL', () => {
    expect(apiClient.defaults.baseURL).toContain('/api/v1');
  });

  it('should have Content-Type header set to JSON', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });
});
