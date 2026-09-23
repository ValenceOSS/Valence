import { useState } from 'react';
import { Image } from 'react-native';
import { Words } from '@ValencePhone/components/Words/Words';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import type { ATitleLogoProps } from './ATitleLogo.types';

/**
 * A title's name as its own lettering, where it has some, and as words where it has none or the
 * lettering will not load.
 *
 * Drawn as wide as the lettering is for its height, so it sits against the left edge the way the
 * web draws it rather than centred in a box of its own. Until it has loaded and said how wide it
 * is, it takes the widest it may.
 *
 * @param mediaId - Whose lettering to draw, or nothing where there is none.
 * @param title - The name, for anybody who cannot see it and for when there is no lettering.
 * @param high - How tall to draw it.
 * @param widest - The widest it may be.
 * @param isOnArtwork - Whether it is drawn over a picture rather than the page.
 */
const ATitleLogo = ({ mediaId, title, high, widest, isOnArtwork = false }: ATitleLogoProps) => {
  const [wide, setWide] = useState<number | null>(null);
  const [isUnlettered, setIsUnlettered] = useState(false);

  if (mediaId === null || isUnlettered) {
    return (
      <Words size="title" lines={2} {...(isOnArtwork ? { tone: 'onArtwork' } : {})}>
        {title}
      </Words>
    );
  }

  return (
    <Image
      style={{ height: high, width: Math.min(wide ?? widest, widest) }}
      resizeMode="contain"
      source={{ uri: onThisServer(`/api/media/${mediaId}/image/logo?at=full`) }}
      accessibilityLabel={title}
      onLoad={(event) => {
        const { width, height } = event.nativeEvent.source;

        if (height > 0) {
          setWide((width / height) * high);
        }
      }}
      onError={() => {
        setIsUnlettered(true);
      }}
    />
  );
};

ATitleLogo.displayName = 'ATitleLogo';

export { ATitleLogo };
