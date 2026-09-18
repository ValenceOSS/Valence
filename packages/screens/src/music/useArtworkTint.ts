import { useEffect, useState } from 'react';
import { readLights } from '@ValenceScreens/library/readLights';

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
 * The colour a page about an album, an artist or a song is washed in, read from its picture — the
 * way the lyrics of a song sit on the colour of its sleeve.
 *
 * @param src - The picture, or nothing where there is none.
 * @returns The colour, or nothing until it has been read or where it could not be.
 */
const useArtworkTint = (src: string | null): string | null => {
  const [tint, setTint] = useState<{ src: string; colour: string | null } | null>(null);

  useEffect(() => {
    if (src === null) {
      return;
    }

    const picture = new Image();
    let isCurrent = true;

    picture.onload = () => {
      if (isCurrent) {
        setTint({ src, colour: mostColourful(readLights(picture).map((light) => light.color)) });
      }
    };

    picture.src = src;

    return () => {
      isCurrent = false;
    };
  }, [src]);

  return src !== null && tint?.src === src ? tint.colour : null;
};

export { mostColourful, useArtworkTint };
