import { cn } from '@ValenceUI/cn';
import fresh from '@ValenceRatings/rotten-tomatoes-fresh.png';
import rotten from '@ValenceRatings/rotten-tomatoes-rotten.png';
import { isFreshTomato } from '@ValenceCore/functions/isFreshTomato';
import type { TomatoMarkProps } from './TomatoMark.types';
import { say } from '@ValenceI18n/say';

/**
 * The mark Rotten Tomatoes shows beside a critics' score: a tomato where the critics were mostly
 * kind, from 60% up, and a green splat where they were not.
 *
 * @param score - The critics' score, as a percentage.
 * @param className - Extra classes for the caller's own layout, including its size.
 */
const TomatoMark = ({ score, className }: TomatoMarkProps) => {
  const isFresh = isFreshTomato(score);

  return (
    <img
      src={isFresh ? fresh : rotten}
      alt={
        isFresh
          ? say('ui.tomatoMark.freshOnRottenTomatoes')
          : say('ui.tomatoMark.rottenOnRottenTomatoes')
      }
      draggable={false}
      className={cn('size-4 shrink-0 select-none object-contain', className)}
    />
  );
};

TomatoMark.displayName = 'TomatoMark';

export { TomatoMark };
