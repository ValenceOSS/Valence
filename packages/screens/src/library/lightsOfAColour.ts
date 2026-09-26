import type { MoodLight } from '@ValenceUI/MoodBackground.types';

const SPREAD: readonly {
  at: string;
  toward: 'white' | 'black' | 'none';
  by: number;
  weight: number;
}[] = [
  { at: '8% 10%', toward: 'none', by: 0, weight: 1 },
  { at: '64% 10%', toward: 'white', by: 0.25, weight: 0.8 },
  { at: '92% 48%', toward: 'black', by: 0.2, weight: 0.9 },
  { at: '36% 48%', toward: 'white', by: 0.12, weight: 0.6 },
  { at: '8% 86%', toward: 'black', by: 0.35, weight: 0.8 },
  { at: '64% 86%', toward: 'none', by: 0, weight: 0.7 },
];

/**
 * Lights a page in one colour rather than from a picture, for somebody with no picture of their
 * own: the colour itself and a few lighter and deeper shades of it, spread across the page so it
 * glows in their colour from edge to edge instead of from one corner.
 *
 * @param colour - The colour, as a hex code such as `#d94b8f`.
 * @returns The lights, or none for something that is not a hex colour.
 */
const lightsOfAColour = (colour: string): MoodLight[] => {
  const hex = /^#?([0-9a-f]{6})$/iu.exec(colour.trim())?.[1];

  if (hex === undefined) {
    return [];
  }

  const channels = [0, 2, 4].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));

  return SPREAD.map(({ at, toward, by, weight }) => {
    const shaded = channels.map((channel) =>
      Math.round(
        toward === 'white'
          ? channel + (255 - channel) * by
          : toward === 'black'
            ? channel * (1 - by)
            : channel,
      ),
    );

    return { color: `rgb(${shaded.join(', ')})`, at, weight };
  });
};

export { lightsOfAColour };
