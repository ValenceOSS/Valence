import { inkFor } from '@ValenceClient/library/inkFor';

const ANGLE = '135deg';

/**
 * Mixes two `#rrggbb` colours half and half, for judging the writing over a gradient by its middle.
 *
 * @param from - One colour.
 * @param to - The other colour.
 * @returns The colour halfway between them.
 */
const halfway = (from: string, to: string): string => {
  const a = Number.parseInt(from.replace('#', ''), 16);
  const b = Number.parseInt(to.replace('#', ''), 16);
  const mixed = [16, 8, 0].map((shift) =>
    Math.round((((a >> shift) & 255) + ((b >> shift) & 255)) / 2)
      .toString(16)
      .padStart(2, '0'),
  );

  return `#${mixed.join('')}`;
};

/**
 * What a letter face is painted with: one colour, or a gradient from it to a second, and whether
 * dark or light writing reads on top.
 *
 * @param colour - The face's colour, or where its gradient starts.
 * @param colourTo - Where the gradient ends, if the face has one.
 * @returns The style to paint the face with and the writing that reads on it.
 */
const facePaint = (
  colour: string,
  colourTo: string | null | undefined,
): { style: { backgroundColor?: string; backgroundImage?: string }; ink: 'dark' | 'light' } =>
  colourTo === undefined || colourTo === null || colourTo === colour
    ? { style: { backgroundColor: colour }, ink: inkFor(colour) }
    : {
        style: {
          backgroundColor: colour,
          backgroundImage: `linear-gradient(${ANGLE}, ${colour}, ${colourTo})`,
        },
        ink: inkFor(halfway(colour, colourTo)),
      };

export { facePaint };
