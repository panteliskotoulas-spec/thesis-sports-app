import { Star } from 'lucide-react';

export interface StarRatingProps {
  value: number;
  label: string;
  size?: 'sm' | 'md';
}

export function StarRating({ value, label, size = 'sm' }: StarRatingProps) {
  const rounded = Math.round(value);
  const iconSize = size === 'md' ? 'size-5' : 'size-4';

  return (
    <span className="flex" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, position) => (
        <Star
          key={position}
          className={`${iconSize} ${
            position < rounded
              ? 'fill-terracotta text-terracotta'
              : 'text-muted-foreground'
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
