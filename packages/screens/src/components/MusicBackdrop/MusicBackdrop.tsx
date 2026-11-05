import { useState } from 'react';
import { cn } from '@ValenceUI/cn';
import type { MusicBackdropProps } from './MusicBackdrop.types';

/**
 * The picture behind the top of a music page, spread across its width, darkened so words can stand
 * on it and fading into the page at its foot. A picture that will not load simply is not there.
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
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className={cn(
          'size-full object-cover',
          isSharp ? 'object-[center_25%]' : 'scale-125 blur-3xl',
        )}
        onError={() => {
          setHasFailed(src);
        }}
      />
      <div className="absolute inset-0 bg-scrim" />
    </div>
  );
};

MusicBackdrop.displayName = 'MusicBackdrop';

export { MusicBackdrop };
