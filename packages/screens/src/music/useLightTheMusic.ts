import { useEffect } from 'react';
import { setMusicLights } from './musicLights';
import { useArtworkLights } from './useArtworkLights';

/**
 * Lights the music section with a picture's colours once it has been read, so an album's page is
 * lit by its cover and an artist's by their picture.
 *
 * @param src - The picture, or nothing to leave the room unlit.
 */
const useLightTheMusic = (src: string | null): void => {
  const lights = useArtworkLights(src);

  useEffect(() => {
    setMusicLights(lights);
  }, [lights]);
};

export { useLightTheMusic };
