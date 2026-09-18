import { useMemo } from 'react';
import { useArtworkLights } from './useArtworkLights';

/**
 * Picks the colour to wash a page in out of the lights read from a picture: the most colourful one,
 * so a black record sleeve with a red title tints the page red rather than grey.
 *
 * @param colours - The colours read, as `rgb()` strings.
 * @returns The one to use, or nothing where none could be read.
 */
const mostColourful = (colours: readonly string[]): string | null => {
  let chosen: string | null = null;
  let best = -1;

  for (const colour of colours) {
    const channels = /rgb\((\d+)[,\s]+(\d+)[,\s]+(\d+)\)/.exec(colour);

    if (channels === null) {
      continue;
    }

    const [red, green, blue] = [channels[1], channels[2], channels[3]].map(Number);
    const high = Math.max(red ?? 0, green ?? 0, blue ?? 0);
    const low = Math.min(red ?? 0, green ?? 0, blue ?? 0);
    const colourfulness = high - low + high * 0.15;

    if (colourfulness > best) {
      best = colourfulness;
      chosen = colour;
    }
  }

  return chosen;
};

/**
 * The most colourful light a picture casts, for tinting what sits around it.
 *
 * @param src - The picture, or nothing.
 * @returns The colour, or nothing until the picture has been read.
 */
const useArtworkTint = (src: string | null): string | null => {
  const lights = useArtworkLights(src);

  return useMemo(
    () => (lights.length === 0 ? null : mostColourful(lights.map((light) => light.color))),
    [lights],
  );
};

export { mostColourful, useArtworkTint };
