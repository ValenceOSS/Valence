import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { MusicNote01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { liquidSpring, stillTransition } from '@ValenceUI/animations/reveal';
import type { MusicArtworkProps } from './MusicArtwork.types';

/**
 * An album's cover or an artist's picture, square or round, with a quiet note standing in wherever
 * there is no picture or it will not load — so a grid of albums never has a hole in it.
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
 * @param travelsAs - The name the picture travels between places as, where it should.
 * @param className - Its size and anything else the caller's layout needs.
 */
const MusicArtwork = ({
  src,
  label,
  shape = 'square',
  travelsAs,
  className,
}: MusicArtworkProps) => {
  const [hasFailed, setHasFailed] = useState<string | null>(null);
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
    </motion.span>
  );
};

MusicArtwork.displayName = 'MusicArtwork';

export { MusicArtwork };
