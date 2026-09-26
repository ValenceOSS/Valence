/**
 * Writes a hue, saturation and brightness back as a `#rrggbb` colour.
 *
 * @param hue - The hue, in degrees.
 * @param saturation - From nothing to one.
 * @param brightness - From nothing to one.
 * @returns The colour.
 */
const hexOfHsv = (hue: number, saturation: number, brightness: number): string => {
  const channel = (offset: number): number => {
    const turn = (offset + hue / 60) % 6;

    return brightness - brightness * saturation * Math.max(0, Math.min(turn, 4 - turn, 1));
  };

  return `#${[channel(5), channel(3), channel(1)]
    .map((part) =>
      Math.round(part * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
};

export { hexOfHsv };
