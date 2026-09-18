import { useEffect, useState } from 'react';
import { readLights } from '@ValenceScreens/library/readLights';
import type { MoodLight } from '@ValenceUI/MoodBackground.types';

const NONE: readonly MoodLight[] = [];

/**
 * The lights a picture would cast — its colours, and where in it each one sits — read once the
 * picture has loaded, so a page can be lit by the artwork it is showing.
 *
 * @param src - The picture, or nothing.
 * @returns Its lights, or none until they have been read.
 */
const useArtworkLights = (src: string | null): readonly MoodLight[] => {
  const [read, setRead] = useState<{ src: string; lights: readonly MoodLight[] } | null>(null);

  useEffect(() => {
    if (src === null) {
      return;
    }

    const picture = new Image();
    let isCurrent = true;

    picture.onload = () => {
      if (isCurrent) {
        setRead({ src, lights: readLights(picture) });
      }
    };

    picture.src = src;

    return () => {
      isCurrent = false;
    };
  }, [src]);

  return src !== null && read?.src === src ? read.lights : NONE;
};

export { useArtworkLights };
