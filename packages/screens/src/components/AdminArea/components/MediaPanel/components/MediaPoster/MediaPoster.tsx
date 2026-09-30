import { ImageX as ImageXIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { MediaPosterProps } from './MediaPoster.types';
import { say } from '@ValenceI18n/say';

/**
 * A title's poster or cover at the size of a row in a list, read from the server's own copy. Where
 * there is none, the space it would take says so, since missing artwork is one of the things an
 * administrator looks down this list to find.
 *
 * @param src - Where the server serves the picture, or null where there is none.
 * @param isSquare - Whether it is a square cover, as an album's is, rather than a tall poster.
 * @param className - Extra classes for the caller's own layout.
 */
const MediaPoster = ({ src, isSquare = false, className }: MediaPosterProps) => (
  <span
    className={cn(
      'flex w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--surface-hover)]',
      isSquare ? 'aspect-square' : 'aspect-[2/3]',
      className,
    )}
  >
    {src === null ? (
      <Icon
        of={ImageXIcon}
        size={14}
        tone="muted"
        label={say('screens.mediaPanel.mediaPoster.noArtwork')}
      />
    ) : (
      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
    )}
  </span>
);

MediaPoster.displayName = 'MediaPoster';

export { MediaPoster };
