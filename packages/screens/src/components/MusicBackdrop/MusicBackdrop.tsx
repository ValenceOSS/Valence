import { useState } from 'react';
import { cn } from '@ValenceUI/cn';
import type { MusicBackdropProps } from './MusicBackdrop.types';

/**
 * The picture across the head of something to listen to: seen as it is where it is a photograph, and
 * melted into a dim colour where it is a square cover too small to fill the width, so a pale one
 * does not take the words laid over it. A picture that will not load simply is not there.
 *
 * @param src - Where the picture is, or nothing where there is none.
 * @param isSharp - Whether it is meant to be seen, rather than melted into colour.
 */
const MusicBackdrop = ({ src, isSharp = false }: MusicBackdropProps) => {
  const [hasFailed, setHasFailed] = useState<string | null>(null);

  if (src === null || hasFailed === src) {
    return null;
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={src}
        alt=""
        draggable={false}
        className={cn(
          'size-full object-cover',
          isSharp ? 'object-[center_25%]' : 'scale-125 blur-3xl brightness-50',
        )}
        onError={() => {
          setHasFailed(src);
        }}
      />
    </div>
  );
};

MusicBackdrop.displayName = 'MusicBackdrop';

export { MusicBackdrop };
