import Link from 'next/link';
import { Avatar } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { CIN } from '@/lib/design/cinema-tokens';
import { resolveMediaUrl } from '@/lib/media-url';

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
      src={resolveMediaUrl(src)}
      alt={username}
      sx={[
        {
          ...sizeMap[size],
          bgcolor: 'rgba(139,124,255,0.18)',
          color: '#C9C1FF',
          border: `1px solid ${CIN.hairline}`,
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
