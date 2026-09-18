import { useState } from 'react';
import { MusicNote01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { MusicArtworkProps } from './MusicArtwork.types';

/**
 * An album's cover or an artist's picture, square or round, with a quiet note standing in wherever
 * there is no picture or it will not load — so a grid of albums never has a hole in it.
 *
 * @param src - Where the picture is, or nothing where there is none.
 * @param label - What it is a picture of, for anybody not looking at it.
 * @param shape - Square for an album, round for a person.
 * @param className - Its size and anything else the caller's layout needs.
 */
const MusicArtwork = ({ src, label, shape = 'square', className }: MusicArtworkProps) => {
  const [hasFailed, setHasFailed] = useState<string | null>(null);
  const isShown = src !== null && hasFailed !== src;

  return (
    <span
      className={cn(
        'relative flex aspect-square shrink-0 items-center justify-center overflow-hidden bg-hover text-text-muted',
        shape === 'round' ? 'rounded-full' : 'rounded-md',
        className,
      )}
    >
      {isShown ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          draggable={false}
          className="size-full object-cover"
          onError={() => {
            setHasFailed(src);
          }}
        />
      ) : (
        <>
          <Icon of={MusicNote01Icon} size={20} />
          <span className="sr-only">{label}</span>
        </>
      )}
    </span>
  );
};

MusicArtwork.displayName = 'MusicArtwork';

export { MusicArtwork };
