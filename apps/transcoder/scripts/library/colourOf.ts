const SATURATION = 0.45;

const LIGHTNESS = 0.35;

/**
 * Picks a colour for a name, the same every time and different for most names, muted enough that a
 * stand-in cover reads as a cover rather than a warning.
 *
 * @param name - What the colour is for.
 * @returns The colour, as six hexadecimal digits.
 */
const colourOf = (name: string): string => {
  let hash = 2166136261;

  for (const character of name) {
    hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619) >>> 0;
  }

  const hue = hash % 360;
  const chroma = (1 - Math.abs(2 * LIGHTNESS - 1)) * SATURATION;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = LIGHTNESS - chroma / 2;
  const sextant = Math.floor(hue / 60);
  const sextants: readonly (readonly [number, number, number])[] = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ];
  const [red, green, blue] = sextants[sextant] ?? [0, 0, 0];

  return [red, green, blue]
    .map((channel) =>
      Math.round((channel + base) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
};

export { colourOf };
