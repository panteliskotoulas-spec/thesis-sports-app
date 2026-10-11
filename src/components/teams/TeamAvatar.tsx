import Image from 'next/image';
import { teamInitials } from '@/lib/teams/team';

const sizes = {
  sm: 'size-10 text-sm',
  md: 'size-12 text-base',
  lg: 'size-20 text-2xl',
} as const;

export interface TeamAvatarProps {
  name: string;
  logoUrl: string | null;
  size?: keyof typeof sizes;
}

export function TeamAvatar({ name, logoUrl, size = 'md' }: TeamAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-medium text-accent-foreground ${sizes[size]}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        teamInitials(name)
      )}
    </span>
  );
}
