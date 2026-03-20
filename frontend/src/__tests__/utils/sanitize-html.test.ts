import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../lib/utils/sanitize-html';

describe('sanitizeHtml', () => {
  it('should strip script tags', () => {
    const dirty = '<script>alert("xss")</script><p>Hello</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('<p>Hello</p>');
  });

  it('should strip onerror handler from img', () => {
    const dirty = '<img src=x onerror=alert(1)>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('onerror');
  });

  it('should preserve allowed tags', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
    const clean = sanitizeHtml(input);
    expect(clean).toContain('<strong>Bold</strong>');
    expect(clean).toContain('<em>italic</em>');
  });

  it('should preserve img with allowed attributes', () => {
    const input = '<img src="photo.jpg" alt="A photo">';
    const clean = sanitizeHtml(input);
    expect(clean).toContain('src="photo.jpg"');
    expect(clean).toContain('alt="A photo"');
  });

  it('should return empty for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should strip onclick handler', () => {
    const dirty = '<p onclick="alert(1)">Click me</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('Click me');
  });

  it('should strip javascript: URLs in href', () => {
    const dirty = '<a href="javascript:alert(1)">Link</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('javascript:');
  });
});
