import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u',
  'h1', 'h2', 'h3',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'img', 'a', 'div', 'span',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'class', 'data-text-align',
  'style',
];

// Tiptap's text-align extension writes inline `style="text-align: <value>"`.
// We re-enable the `style` attribute but restrict its content to a single
// whitelisted property/value pair to keep XSS vectors (url(), expression(),
// etc.) closed. Any other style content is stripped to empty string, which
// DOMPurify then drops.
const ALLOWED_TEXT_ALIGN = new Set(['left', 'center', 'right', 'justify']);
const STYLE_TEXT_ALIGN_RE = /^\s*text-align\s*:\s*([a-z]+)\s*;?\s*$/i;

let hooksInstalled = false;
function ensureHooksInstalled() {
  if (hooksInstalled) return;
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style') return;
    const match = STYLE_TEXT_ALIGN_RE.exec(data.attrValue);
    if (match && ALLOWED_TEXT_ALIGN.has(match[1].toLowerCase())) {
      data.attrValue = `text-align: ${match[1].toLowerCase()}`;
      return;
    }
    // Anything else — drop the style entirely.
    data.attrValue = '';
    data.keepAttr = false;
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
