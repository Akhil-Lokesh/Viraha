import { describe, it, expect } from 'vitest';
import { describeUserAgent, formatLastUsed } from '../../components/settings/session-utils';

describe('describeUserAgent', () => {
  it('detects Chrome on macOS', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      )
    ).toBe('Chrome on macOS');
  });

  it('detects Safari on iOS', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
      )
    ).toBe('Safari on iOS');
  });

  it('detects Firefox on Windows', () => {
    expect(
      describeUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0')
    ).toBe('Firefox on Windows');
  });

  it('prefers Edge over Chrome when both tokens present', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
      )
    ).toBe('Edge on Windows');
  });

  it('detects Chrome on Android', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
      )
    ).toBe('Chrome on Android');
  });

  it('falls back to "Unknown device" for empty or null input', () => {
    expect(describeUserAgent(null)).toBe('Unknown device');
    expect(describeUserAgent('')).toBe('Unknown device');
    expect(describeUserAgent('   ')).toBe('Unknown device');
    expect(describeUserAgent('curl/8.4.0')).toBe('Unknown device');
  });
});

describe('formatLastUsed', () => {
  it('returns "Never used" for missing or invalid timestamps', () => {
    expect(formatLastUsed(null)).toBe('Never used');
    expect(formatLastUsed(undefined)).toBe('Never used');
    expect(formatLastUsed('not-a-date')).toBe('Never used');
  });

  it('returns a relative "ago" label for valid timestamps', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatLastUsed(fiveMinutesAgo)).toMatch(/ago$/);
  });
});
