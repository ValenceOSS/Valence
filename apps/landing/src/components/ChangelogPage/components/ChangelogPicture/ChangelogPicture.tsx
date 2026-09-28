import { useState } from 'react';
import type { ChangelogPictureProps } from './ChangelogPicture.types';

/**
 * A picture of what changed, framed on the page's own dark ground with a hairline edge, and left
 * out altogether where it cannot be read rather than leaving a broken frame behind.
 *
 * @param picture - Where it is and what it shows.
 * @param isEager - Whether it is the first thing on the page, and so worth fetching at once.
 */
const ChangelogPicture = ({ picture, isEager = false }: ChangelogPictureProps) => {
  const [isMissing, setIsMissing] = useState(false);

  if (isMissing) {
    return null;
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-border/60 bg-surface-raised shadow-[var(--shadow-cast)]">
      <img
        src={picture.src}
        alt={picture.alt}
        loading={isEager ? 'eager' : 'lazy'}
        className="block w-full"
        onError={() => {
          setIsMissing(true);
        }}
      />
    </figure>
  );
};

ChangelogPicture.displayName = 'ChangelogPicture';

export { ChangelogPicture };
