/**
 * How far apart two colours are in brightness, as WCAG measures it: 1 for the same colour, 21 for
 * black on white.
 *
 * @param first - A colour as `#rrggbb`.
 * @param second - Another, as `#rrggbb`.
 * @returns The ratio, from 1 to 21.
 */
const contrastRatio = (first: string, second: string): number => {
  const linear = (colour: string, at: number): number => {
    const channel = Number.parseInt(colour.slice(at, at + 2), 16) / 255;

    return channel <= 0.039_28 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (colour: string): number =>
    0.2126 * linear(colour, 1) + 0.7152 * linear(colour, 3) + 0.0722 * linear(colour, 5);
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));

  return (lighter + 0.05) / (darker + 0.05);
};

export { contrastRatio };
