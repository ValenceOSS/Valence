import { useEffect, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import type { TitleLogoProps } from './TitleLogo.types';

/**
 * A title as its designer lettered it, drawn over artwork exactly as the catalogue gives it, as the
 * phone and the television draw it. It fades in once it has loaded rather than appearing a piece at
 * a time.
 *
 * Logos lettered in black used to be turned white here so they would read over a darkened frame,
 * but that turned every coloured part of them white too, a studio's red box among them; a logo that
 * does not read over its artwork is better chosen again than repainted.
 *
 * @param src - Where the logo is served from.
 * @param alt - The title, for anybody who cannot see it.
 * @param className - How large it stands, and anything else the caller's layout needs.
 * @param onError - Told when the logo cannot be loaded, so the caller can set the title in type.
 */
const TitleLogo = ({ src, alt, className, onError }: TitleLogoProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        className,
        'transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]',
        isLoaded ? 'opacity-100' : 'opacity-0',
      )}
      onLoad={() => {
        setIsLoaded(true);
      }}
      {...(onError === undefined ? {} : { onError })}
    />
  );
};

TitleLogo.displayName = 'TitleLogo';

export { TitleLogo };
