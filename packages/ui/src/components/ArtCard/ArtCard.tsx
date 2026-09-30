import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { ArtCardProps } from './ArtCard.types';

/**
 * A title as a picture alone, the way a streaming service's home page lays one out: its backdrop,
 * lying flat, with its own logo drawn into the corner rather than its name written beneath. Where
 * there is no logo the name is written into the picture in its place, so the card still says what
 * it is.
 *
 * A flag along the bottom edge says what is new about it — just added, or a new episode — in the
 * same glass the player's menus wear over a picture, without an edge, and a
 * thin bar beneath the picture says how far through it this viewer is.
 *
 * @param title - What it is called, which a reader hears and which stands in for a missing logo.
 * @param imageUrl - Its backdrop.
 * @param logoUrl - Its logo, drawn over the backdrop.
 * @param flag - What is new about it, where anything is.
 * @param watchedFraction - How far through it this viewer is.
 * @param onSelect - Told it was pressed.
 * @param className - Extra classes for the caller's own layout.
 */
const ArtCard = ({
  title,
  imageUrl,
  logoUrl,
  flag,
  watchedFraction,
  onSelect,
  className,
}: ArtCardProps) => {
  const [isLogoMissing, setIsLogoMissing] = useState(false);
  const hasLogo = logoUrl !== undefined && !isLogoMissing;
  const watched = watchedFraction === undefined ? null : Math.min(Math.max(watchedFraction, 0), 1);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        variant="bare"
        size="none"
        hasTooltip={false}
        label={flag === undefined ? title : `${title}, ${flag}`}
        className="group block w-full"
        onClick={onSelect}
      >
        <span className="relative block aspect-video w-full overflow-hidden rounded-lg bg-surface-raised shadow-[var(--shadow-lifted)]">
          {imageUrl === undefined ? null : (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 size-full object-cover transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none hover-hover:group-hover:scale-[1.03]"
            />
          )}

          <span className="absolute inset-0 bg-linear-to-tr from-shade/70 via-shade/10 to-transparent" />

          {hasLogo ? (
            <img
              src={logoUrl}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute bottom-[14%] left-[6%] max-h-[40%] max-w-[55%] object-contain object-left-bottom drop-shadow-lg"
              onError={() => {
                setIsLogoMissing(true);
              }}
            />
          ) : (
            <span className="absolute inset-x-[6%] bottom-[14%] line-clamp-2 text-left text-lg font-bold leading-tight tracking-tight text-on-scrim drop-shadow-lg">
              {title}
            </span>
          )}

          {flag === undefined ? null : (
            <span className="valence-glass valence-glass--film valence-glass--edgeless absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-t-lg px-3 py-1 text-xs font-semibold">
              {flag}
            </span>
          )}
        </span>
      </Button>

      {watched === null || watched <= 0 ? null : (
        <span
          role="img"
          aria-label={`${Math.round(watched * 100).toString()}% watched`}
          className="mx-auto block h-1 w-3/5 overflow-hidden rounded-full bg-on-scrim/25"
        >
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${(watched * 100).toString()}%` }}
          />
        </span>
      )}
    </div>
  );
};

ArtCard.displayName = 'ArtCard';

export { ArtCard };
