/**
 * Whether dark or light writing reads on a colour, judged by how bright the colour looks to an
 * eye rather than by its numbers, since a yellow and a blue of the same value are nothing alike.
 *
 * @param hex - The colour behind the writing, as `#rrggbb`.
 * @returns A near-black for a light colour and a near-white for a dark one.
 */
const inkFor = (hex: string): 'dark' | 'light' => {
  const value = Number.parseInt(hex.replace('#', ''), 16);

  if (Number.isNaN(value)) {
    return 'light';
  }

  const linear = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const part = channel / 255;

    return part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
  });
  const [red = 0, green = 0, blue = 0] = linear;

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue > 0.4 ? 'dark' : 'light';
};

export { inkFor };
