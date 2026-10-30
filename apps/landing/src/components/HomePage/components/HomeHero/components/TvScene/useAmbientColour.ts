import { useEffect, useState } from 'react';
import { dominantColours } from './dominantColours';
import { samplePixels } from './samplePixels';

const NONE: readonly string[] = [];

/**
 * Reads the colours of whatever the television is showing, so the room can be lit in them.
 *
 * @param source - The picture on the screen, once it has loaded; it must come from this site.
 * @returns Its colours as `#rrggbb`, strongest first, or none until there is a picture to read.
 */
const useAmbientColour = (source: HTMLImageElement | null): readonly string[] => {
  const [colours, setColours] = useState<readonly string[]>(NONE);

  useEffect(() => {
    const pixels = source === null ? null : samplePixels(source);

    if (pixels !== null) {
      setColours(dominantColours(pixels));
    }
  }, [source]);

  return colours;
};

export { useAmbientColour };
