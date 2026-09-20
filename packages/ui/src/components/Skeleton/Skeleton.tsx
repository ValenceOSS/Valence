import { cn } from '@ValenceUI/cn';
import type { SkeletonProps } from './Skeleton.types';

const SHAPES = {
  card: 'rounded-lg',
  soft: 'rounded-md',
  round: 'rounded-full',
} as const;

/**
 * Holds the space something will occupy while it is still being fetched, so a page settles into
 * place rather than jumping as each part lands. Shaped by the caller, since only the caller knows
 * what is coming.
 *
 * @param label - What is being waited for, for anybody who cannot see the shape.
 * @param shape - The corners to hold: the rounded default, a softer one for a cover, or a circle.
 * @param className - The size to hold, as classes — the corners are the shape's to say.
 */
const Skeleton = ({ label, shape = 'card', className }: SkeletonProps) => (
  <span
    role={label === undefined ? 'presentation' : 'status'}
    aria-label={label}
    aria-hidden={label === undefined}
    className={cn(
      'block animate-pulse bg-subtle motion-reduce:animate-none',
      SHAPES[shape],
      className,
    )}
  />
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
