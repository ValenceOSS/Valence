import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { MusicNote as MusicNoteIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { OriginMark } from '@ValenceUI/OriginMark';
import { liquidSpring, stillTransition } from '@ValenceUI/animations/reveal';
import type { MusicArtworkProps } from './MusicArtwork.types';

/**
 * An album's cover or an artist's picture, square or round, with a quiet note standing in wherever
 * there is no picture, until it has loaded, or where it will not — so a grid of albums never has a
 * hole in it, nor a broken picture where a slow one is still on its way.
 *
 * A picture given a name to travel as is one thing wherever it appears under that name: opening an
 * album from its tile carries the cover from the tile up into the album's header, rather than one
 * cover vanishing as another appears somewhere else. Somebody who has asked for less movement sees
 * it simply arrive. Only one picture on screen may travel under a name at a time: given two, Motion
 * treats one as having left and hides it.
 *
 * @param src - Where the picture is, or nothing where there is none.
 * @param label - What it is a picture of, for anybody not looking at it.
 * @param shape - Square for an album, round for a person.
 * @param isLifted - Whether it stands off the page on a shadow, as a cover shown large does.
 * @param travelsAs - The name the picture travels between places as, where it should.
 * @param origin - The other server it comes from, marked in a corner, where it does.
 * @param className - Its size and anything else the caller's layout needs.
 */
const MusicArtwork = ({
  src,
  label,
  shape = 'square',
  isLifted = false,
  travelsAs,
  origin,
  className,
}: MusicArtworkProps) => {
  const [hasFailed, setHasFailed] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotionConfig();
  const isShown = src !== null && hasFailed !== src;

  return (
    <motion.span
      {...(travelsAs === undefined
        ? {}
        : {
            layoutId: travelsAs,
            transition: {
              layout: prefersReducedMotion === true ? { duration: 0 } : liquidSpring,
              opacity: stillTransition,
            },
          })}
      className={cn(
        'relative flex aspect-square shrink-0 items-center justify-center overflow-hidden bg-hover text-text-muted',
        shape === 'round' ? 'rounded-full' : 'rounded-md',
        isLifted && 'shadow-[var(--shadow-artwork)]',
        className,
      )}
    >
      {isShown && hasLoaded === src ? null : <Icon of={MusicNoteIcon} size={20} />}

      {isShown ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          draggable={false}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-out)]',
            hasLoaded === src ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={() => {
            setHasLoaded(src);
          }}
          onError={() => {
            setHasFailed(src);
          }}
        />
      ) : (
        <span className="sr-only">{label}</span>
      )}

      {origin === undefined ? null : (
        <OriginMark {...origin} className="absolute bottom-1.5 left-1.5 size-5" />
      )}
    </motion.span>
  );
};

MusicArtwork.displayName = 'MusicArtwork';

export { MusicArtwork };
