import { useState } from 'react';
import { Logo } from '@ValenceUI/Logo';
import type { BrandLogoProps } from './BrandLogo.types';

/**
 * The server's mark: the logo an administrator gave it, or Valence's where it has none or the logo
 * cannot be loaded, so a broken address never shows as a broken picture.
 *
 * @param logo - Where the administrator's logo is, if they gave one.
 * @param size - How large it is drawn, in pixels.
 * @param label - What Valence's own mark is read out as, where it is the one drawn.
 */
const BrandLogo = ({ logo, size, label }: BrandLogoProps) => {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  if (logo === null || logo === failedLogo) {
    return <Logo size={size} isSolid {...(label === undefined ? {} : { label })} />;
  }

  return (
    <img
      src={logo}
      alt=""
      width={size}
      height={size}
      className="rounded-md object-contain"
      onError={() => {
        setFailedLogo(logo);
      }}
    />
  );
};

BrandLogo.displayName = 'BrandLogo';

export { BrandLogo };
