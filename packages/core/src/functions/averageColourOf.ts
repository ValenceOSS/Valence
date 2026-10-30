/**
 * The average colour of a run of pixels, as a canvas hands them over: red, green, blue and how
 * opaque, four numbers to a pixel.
 *
 * @param pixels - The pixels' channels, each from 0 to 255.
 * @returns The average red, green and blue, each from 0 to 255, or nothing where there are no
 *   pixels.
 */
const averageColourOf = (pixels: ArrayLike<number>): readonly [number, number, number] | null => {
  const count = Math.floor(pixels.length / 4);

  if (count === 0) {
    return null;
  }

  const sums = [0, 0, 0];

  for (let at = 0; at < count * 4; at += 4) {
    sums[0] = (sums[0] ?? 0) + (pixels[at] ?? 0);
    sums[1] = (sums[1] ?? 0) + (pixels[at + 1] ?? 0);
    sums[2] = (sums[2] ?? 0) + (pixels[at + 2] ?? 0);
  }

  return [(sums[0] ?? 0) / count, (sums[1] ?? 0) / count, (sums[2] ?? 0) / count];
};

export { averageColourOf };
