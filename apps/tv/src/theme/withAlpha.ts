const AN_RGBA = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)$/u;

/**
 * One of the palette's colours made translucent, the way ValenceUI writes `bg-accent/15`.
 *
 * @param colour - A palette colour, as `rgba()`.
 * @param alpha - How opaque, from 0 to 1.
 * @returns The colour at that opacity, or the colour as it was where it is not `rgba()`.
 */
const withAlpha = (colour: string, alpha: number): string => {
  const read = AN_RGBA.exec(colour);

  return read === null
    ? colour
    : `rgba(${read[1] ?? '0'}, ${read[2] ?? '0'}, ${read[3] ?? '0'}, ${alpha.toString()})`;
};

export { withAlpha };
