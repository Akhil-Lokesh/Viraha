import Link from 'next/link';
import { Avatar } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * Resolve an avatar/media `src` to an absolute URL.
 *
 * Storage returns relative `/uploads/...` paths for non-R2 deploys; those must be
 * prefixed with the API origin (NEXT_PUBLIC_API_URL minus its `/api/v1` suffix) so
 * the browser fetches them from the backend instead of the Next.js host. Absolute
 * URLs (R2/CDN) and falsy values are passed through unchanged.
 *
 * Mirrors the prefixing logic in settings/page.tsx and layout/user-menu.tsx.
 */
export function resolveAvatarUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';
  return `${apiOrigin}${src}`;
}

interface UserAvatarProps {
  src?: string | null;
  username: string;
  displayName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  link?: boolean;
  sx?: SxProps<Theme>;
}

const sizeMap = {
  sm: { width: 28, height: 28, fontSize: '10px' },
  md: { width: 40, height: 40, fontSize: '0.875rem' },
  lg: { width: 64, height: 64, fontSize: '1.125rem' },
  xl: { width: 96, height: 96, fontSize: '1.5rem' },
};

export function UserAvatar({
  src,
  username,
  displayName,
  size = 'md',
  link = true,
  sx: sxProp,
}: UserAvatarProps) {
  const initials = (displayName || username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatar = (
    <Avatar
      src={resolveAvatarUrl(src)}
      alt={username}
      sx={[
        {
          ...sizeMap[size],
          bgcolor: 'primary.light',
          color: 'primary.main',
          fontWeight: 500,
        },
        ...(Array.isArray(sxProp) ? sxProp : sxProp ? [sxProp] : []),
      ]}
    >
      {initials}
    </Avatar>
  );

  if (link) {
    return (
      <Link href={`/profile/${username}`} style={{ flexShrink: 0 }}>
        {avatar}
      </Link>
    );
  }

  return avatar;
}
