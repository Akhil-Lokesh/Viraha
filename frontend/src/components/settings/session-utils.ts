import { formatDistanceToNow } from 'date-fns';

/**
 * Turns a raw User-Agent string into a short human label like
 * "Chrome on macOS". Heuristic only — order matters (e.g. Edge and Opera
 * UAs also contain "Chrome"; Chrome and Safari UAs both contain "Safari").
 */
export function describeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent || userAgent.trim() === '') return 'Unknown device';

  const ua = userAgent.toLowerCase();

  const browser = ua.includes('edg/') || ua.includes('edge/')
    ? 'Edge'
    : ua.includes('opr/') || ua.includes('opera')
      ? 'Opera'
      : ua.includes('samsungbrowser')
        ? 'Samsung Internet'
        : ua.includes('firefox/')
          ? 'Firefox'
          : ua.includes('crios/')
            ? 'Chrome'
            : ua.includes('chrome/') || ua.includes('chromium')
              ? 'Chrome'
              : ua.includes('safari/')
                ? 'Safari'
                : null;

  const os = ua.includes('windows')
    ? 'Windows'
    : ua.includes('android')
      ? 'Android'
      : ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')
        ? 'iOS'
        : ua.includes('mac os x') || ua.includes('macintosh')
          ? 'macOS'
          : ua.includes('cros')
            ? 'ChromeOS'
            : ua.includes('linux')
              ? 'Linux'
              : null;

  if (browser && os) return `${browser} on ${os}`;
  if (browser) return browser;
  if (os) return os;
  return 'Unknown device';
}

/** Relative "last used" label, e.g. "12 minutes ago". */
export function formatLastUsed(lastUsedAt: string | null | undefined): string {
  if (!lastUsedAt) return 'Never used';
  const date = new Date(lastUsedAt);
  if (Number.isNaN(date.getTime())) return 'Never used';
  return `${formatDistanceToNow(date, { addSuffix: false })} ago`;
}
