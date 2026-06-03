import DOMPurify from 'isomorphic-dompurify';

// Journal entries (Tiptap) support inline images the author uploads via the
// editor toolbar. We keep `img` but restrict its `src` (below) to the app's own
// image hosts, so a journal author cannot embed a third-party tracking pixel or
// trigger SSRF against a remote URL.
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u',
  'h1', 'h2', 'h3',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img', 'div', 'span',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'class', 'data-text-align',
  'style',
];

// Image src allowlist: same-origin relative paths (e.g. /uploads/...), the app's
// R2 bucket, or the API origin (which serves /uploads in non-R2 deploys).
// Anything else — remote trackers, data:, javascript: — is dropped.
const R2_URL = (process.env.NEXT_PUBLIC_R2_URL || '').replace(/\/+$/, '');
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(
  /\/api\/v1\/?$/,
  '',
);

function isAllowedImageSrc(src: string): boolean {
  const value = src.trim();
  if (value.startsWith('/')) return true; // same-origin relative
  if (R2_URL && value.startsWith(`${R2_URL}/`)) return true;
  if (API_ORIGIN && value.startsWith(`${API_ORIGIN}/`)) return true;
  return false;
}

// Tiptap's text-align extension writes inline `style="text-align: <value>"`.
// We re-enable the `style` attribute but restrict its content to a single
// whitelisted property/value pair to keep XSS vectors (url(), expression(),
// etc.) closed. Any other style content is stripped to empty string, which
// DOMPurify then drops.
const ALLOWED_TEXT_ALIGN = new Set(['left', 'center', 'right', 'justify']);
const STYLE_TEXT_ALIGN_RE = /^\s*text-align\s*:\s*([a-z]+)\s*;?\s*$/i;

let hooksInstalled = false;
function ensureHooksInstalled(): void {
  if (hooksInstalled) return;

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'style') {
      const match = STYLE_TEXT_ALIGN_RE.exec(data.attrValue);
      if (match && ALLOWED_TEXT_ALIGN.has(match[1].toLowerCase())) {
        data.attrValue = `text-align: ${match[1].toLowerCase()}`;
      } else {
        // Anything else — drop the style entirely.
        data.attrValue = '';
        data.keepAttr = false;
      }
      return;
    }

    if (data.attrName === 'src' && node.nodeName === 'IMG' && !isAllowedImageSrc(data.attrValue)) {
      data.attrValue = '';
      data.keepAttr = false;
    }
  });

  // Force safe rel/target on every anchor so a journal author cannot open a
  // window with access to `window.opener` (reverse-tabnabbing). Duck-type the
  // node instead of `instanceof Element` — `Element` is not a global in
  // Node/SSR, where this sanitizer also runs.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName === 'A' && typeof (node as Element).setAttribute === 'function') {
      const el = node as Element;
      if (el.hasAttribute('href')) {
        el.setAttribute('rel', 'noopener noreferrer');
        if (el.hasAttribute('target')) {
          el.setAttribute('target', '_blank');
        }
      }
    }
  });

  hooksInstalled = true;
}

export function sanitizeHtml(dirty: string): string {
  ensureHooksInstalled();
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
