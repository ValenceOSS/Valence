/**
 * Reads a `#rrggbb` colour as hue, saturation and brightness — the three things a colour picker
 * lets somebody move — with the hue in degrees and the other two from nothing to one.
 *
 * @param hex - The colour.
 * @returns Its hue, saturation and brightness, or a plain red where the colour cannot be read.
 */
const hsvOf = (hex: string): { hue: number; saturation: number; brightness: number } => {
  const value = Number.parseInt(hex.replace('#', ''), 16);

  if (Number.isNaN(value) || hex.replace('#', '').length !== 6) {
    return { hue: 0, saturation: 1, brightness: 1 };
  }

  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;
  const most = Math.max(red, green, blue);
  const spread = most - Math.min(red, green, blue);
  const hue =
    spread === 0
      ? 0
      : most === red
        ? 60 * (((green - blue) / spread + 6) % 6)
        : most === green
          ? 60 * ((blue - red) / spread + 2)
          : 60 * ((red - green) / spread + 4);

  return { hue, saturation: most === 0 ? 0 : spread / most, brightness: most };
};

export { hsvOf };
