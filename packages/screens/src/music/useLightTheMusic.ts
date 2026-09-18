import { useEffect } from 'react';
import { setMusicLights } from './musicLights';
import { useArtworkLights } from './useArtworkLights';

/**
 * Lights the music section with a picture's colours once it has been read, so an album's page is
 * lit by its cover and an artist's by their picture.
 *
 * Whatever lit the room before stays lit while a new picture is read, so moving from one album to
 * the next carries the light from one to the other rather than dropping to the house lights between.
 *
 * @param src - The picture, or nothing to leave the room unlit.
 */
const useLightTheMusic = (src: string | null): void => {
  const lights = useArtworkLights(src);

  useEffect(() => {
    if (src === null || lights.length > 0) {
      setMusicLights(lights);
    }
  }, [src, lights]);
};

export { useLightTheMusic };
