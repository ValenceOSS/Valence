import { cn } from '@ValenceUI/cn';
import { ageRatingOf } from '@ValenceCore/functions/ageRatingOf';
import { RATING_PICTURES } from './RATING_PICTURES';
import type { AgeRatingProps } from './AgeRating.types';

const SIZES = {
  sm: 'h-6',
  md: 'h-8',
} as const;

/**
 * A title's certificate as the board that issued it publishes it — the BBFC's own 15, the MPA's
 * own PG-13 — and, where there is no mark for it, written out in an outline, rather than a mark
 * made up to look like one.
 *
 * @param certification - The certificate, such as 15 or PG-13.
 * @param region - The two-letter country whose board issued it.
 * @param size - How large it stands.
 * @param className - Extra classes for the caller's own layout.
 */
const AgeRating = ({ certification, region, size = 'sm', className }: AgeRatingProps) => {
  const rating = ageRatingOf(region, certification);

  if (rating.picture === null) {
    return (
      <span
        role="img"
        aria-label={rating.label}
        className={cn(
          'inline-flex shrink-0 select-none items-center justify-center rounded-md border border-current/60 px-2 text-[0.65rem] font-semibold leading-none tracking-[0.12em] uppercase text-current',
          SIZES[size],
          className,
        )}
      >
        {rating.said}
      </span>
    );
  }

  return (
    <img
      src={RATING_PICTURES[rating.picture]}
      alt={rating.label}
      draggable={false}
      className={cn('w-auto shrink-0 select-none object-contain', SIZES[size], className)}
    />
  );
};

AgeRating.displayName = 'AgeRating';

export { AgeRating };
