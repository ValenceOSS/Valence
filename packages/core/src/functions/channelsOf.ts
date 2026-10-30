const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/iu;

const RGB = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/iu;

/**
 * The red, green and blue of a colour, from the forms Valence writes its colours in: a hex code or
 * `rgb()`.
 *
 * @param colour - The colour.
 * @returns Its three channels from 0 to 255, or nothing where it could not be read.
 */
const channelsOf = (colour: string): readonly [number, number, number] | null => {
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
  const [red, green, blue] = channels ?? [];

  return red === undefined || green === undefined || blue === undefined ? null : [red, green, blue];
};

export { channelsOf };
