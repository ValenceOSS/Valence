const AN_RGBA = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)$/u;

const A_HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/iu;

/**
 * One of the palette's colours made translucent, the way ValenceUI writes `bg-accent/15`. The
 * palette's own colours are `rgba()`, and a plugin theme's are `#rrggbb`; both are understood.
 *
 * @param colour - A palette colour, as `rgba()` or `#rrggbb`.
 * @param alpha - How opaque, from 0 to 1.
 * @returns The colour at that opacity, or the colour as it was where it is neither.
 */
const withAlpha = (colour: string, alpha: number): string => {
  const read = AN_RGBA.exec(colour);

  if (read !== null) {
    return `rgba(${read[1] ?? '0'}, ${read[2] ?? '0'}, ${read[3] ?? '0'}, ${alpha.toString()})`;
  }

  const hex = A_HEX.exec(colour);

  if (hex === null) {
    return colour;
  }

  const [red, green, blue] = [hex[1], hex[2], hex[3]].map((pair) =>
    Number.parseInt(pair ?? '0', 16).toString(),
  );

  return `rgba(${red ?? '0'}, ${green ?? '0'}, ${blue ?? '0'}, ${alpha.toString()})`;
};

export { withAlpha };
