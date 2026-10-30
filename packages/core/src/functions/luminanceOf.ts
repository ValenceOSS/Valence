import { channelsOf } from '@ValenceCore/functions/channelsOf';

/**
 * How bright a colour looks, as its relative luminance: what a screen gives off for it, weighted as
 * an eye weighs red, green and blue.
 *
 * @param colour - The colour.
 * @returns From nothing for black to one for white, or nothing where it could not be read.
 */
const luminanceOf = (colour: string): number | null => {
  const channels = channelsOf(colour);

  if (channels === null) {
    return null;
  }

  const [red, green, blue] = channels.map((channel) => {
    const share = channel / 255;

    return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
};

export { luminanceOf };
