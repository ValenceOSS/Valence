import { cn } from '@ValenceUI/cn';
import fresh from '@ValenceRatings/rotten-tomatoes-fresh.png';
import rotten from '@ValenceRatings/rotten-tomatoes-rotten.png';
import type { TomatoMarkProps } from './TomatoMark.types';

const FRESH_FROM = 60;

/**
 * The mark Rotten Tomatoes shows beside a critics' score: a tomato where the critics were mostly
 * kind, from 60% up, and a green splat where they were not.
 *
 * @param score - The critics' score, as a percentage.
 * @param className - Extra classes for the caller's own layout, including its size.
 */
const TomatoMark = ({ score, className }: TomatoMarkProps) => {
  const isFresh = score >= FRESH_FROM;

  return (
    <img
      src={isFresh ? fresh : rotten}
      alt={isFresh ? 'Fresh on Rotten Tomatoes' : 'Rotten on Rotten Tomatoes'}
      draggable={false}
      className={cn('size-4 shrink-0 select-none object-contain', className)}
    />
  );
};

TomatoMark.displayName = 'TomatoMark';

export { TomatoMark };
