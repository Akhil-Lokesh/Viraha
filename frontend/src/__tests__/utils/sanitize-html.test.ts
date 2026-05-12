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

  describe('Tiptap text-align style allowlist (commit 0eb829b)', () => {
    it('should preserve a bare text-align: center style', () => {
      const input = '<p style="text-align: center">x</p>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('style="text-align: center"');
      expect(clean).toContain('>x</p>');
    });

    it('should preserve text-align: left | right | justify', () => {
      for (const value of ['left', 'right', 'justify']) {
        const clean = sanitizeHtml(`<p style="text-align: ${value}">x</p>`);
        expect(clean).toContain(`style="text-align: ${value}"`);
      }
    });

    it('should strip an unrelated style property like background: url(...)', () => {
      const input = '<p style="background: url(http://evil)">x</p>';
      const clean = sanitizeHtml(input);
      expect(clean).not.toContain('background');
      expect(clean).not.toContain('url(');
      // Tag content survives; the style attribute is dropped entirely.
      expect(clean).toContain('>x</p>');
      expect(clean).not.toContain('style=');
    });

    it('should strip a compound style (text-align + background) — regex anchor rejects multi-property', () => {
      const input = '<p style="text-align: center; background: url(http://evil)">x</p>';
      const clean = sanitizeHtml(input);
      expect(clean).not.toContain('background');
      expect(clean).not.toContain('url(');
      expect(clean).not.toContain('style=');
      expect(clean).toContain('>x</p>');
    });

    it('should reject non-allowlisted text-align values like inherit', () => {
      const input = '<p style="text-align: inherit">x</p>';
      const clean = sanitizeHtml(input);
      expect(clean).not.toContain('inherit');
      expect(clean).not.toContain('style=');
    });

    it('should be case-insensitive on the property name and value', () => {
      const input = '<p style="TEXT-ALIGN: CENTER">x</p>';
      const clean = sanitizeHtml(input);
      // The hook normalises to lowercase
      expect(clean).toContain('style="text-align: center"');
    });
  });
});
