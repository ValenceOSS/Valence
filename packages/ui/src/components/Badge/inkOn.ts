const LIGHT_INK = '#ffffff';

const DARK_INK = '#111111';

/**
 * Chooses the ink to set on a colour so the words can be read: white on the dark ones, near-black on
 * the light ones.
 *
 * Judged by how bright the colour looks to an eye rather than by its average, because a fully
 * saturated yellow and a fully saturated blue are the same distance from white by arithmetic and
 * nothing like it by sight.
 *
 * @param colour - A six-digit hex colour, with or without the leading hash.
 * @returns The ink to use, which is white where the colour could not be read.
 */
const inkOn = (colour: string): string => {
  const digits = colour.replace('#', '');

  if (!/^[0-9a-fA-F]{6}$/.test(digits)) {
    return LIGHT_INK;
  }

  const red = Number.parseInt(digits.slice(0, 2), 16);
  const green = Number.parseInt(digits.slice(2, 4), 16);
  const blue = Number.parseInt(digits.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? DARK_INK : LIGHT_INK;
};

export { inkOn };
