const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/iu;

const RGB = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/iu;

/**
 * A colour made see-through by so much, from the forms Valence writes its colours in — a hex
 * code, as a profile's colour is, or `rgb()`, as the web's house lights are — since the phone's
 * gradients cannot mix a colour into transparency the way a browser's can.
 *
 * @param colour - The colour.
 * @param alpha - How much of it shows, from nothing at 0 to all of it at 1.
 * @returns The colour as `rgba()`, or transparent where it could not be read.
 */
const withAlpha = (colour: string, alpha: number): string => {
  const hex = HEX.exec(colour.trim())?.[1];
  const rgb = RGB.exec(colour.trim());
  const channels =
    hex === undefined
      ? rgb === null
        ? null
        : [rgb[1], rgb[2], rgb[3]].map(Number)
      : (hex.length === 3
          ? [...hex].map((digit) => `${digit}${digit}`)
          : (hex.match(/../gu) ?? [])
        ).map((pair) => Number.parseInt(pair, 16));

  if (channels === null || channels.length !== 3) {
    return 'transparent';
  }

  return `rgba(${channels.join(', ')}, ${Math.min(Math.max(alpha, 0), 1).toString()})`;
};

export { withAlpha };
