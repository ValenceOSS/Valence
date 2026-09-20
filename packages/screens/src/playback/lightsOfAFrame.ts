const LEAST_LIGHT = 40;

const BOOST = 1.35;

/**
 * Reads the colour of each quarter of a frame, which is what the glow around the picture is drawn
 * from. Each is the average of the pixels in it, pushed a little brighter and further from grey so
 * that a dim scene still gives a glow that can be seen, and never so dark that it is not there.
 *
 * @param pixels - The frame's pixels, four bytes to each: red, green, blue, alpha.
 * @param width - How many pixels wide the frame is.
 * @param height - How many pixels high it is.
 * @returns A colour for the top left, top right, bottom left and bottom right, as CSS.
 */
const lightsOfAFrame = (pixels: Uint8ClampedArray, width: number, height: number): string[] => {
  const totals = [0, 1, 2, 3].map(() => ({ red: 0, green: 0, blue: 0, count: 0 }));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const quarter = totals[(y < height / 2 ? 0 : 2) + (x < width / 2 ? 0 : 1)];
      const at = (y * width + x) * 4;

      if (quarter !== undefined) {
        quarter.red += pixels[at] ?? 0;
        quarter.green += pixels[at + 1] ?? 0;
        quarter.blue += pixels[at + 2] ?? 0;
        quarter.count += 1;
      }
    }
  }

  return totals.map(({ red, green, blue, count }) => {
    const average = count === 0 ? [0, 0, 0] : [red / count, green / count, blue / count];
    const grey = ((average[0] ?? 0) + (average[1] ?? 0) + (average[2] ?? 0)) / 3;

    const [r = 0, g = 0, b = 0] = average.map((channel) =>
      Math.round(Math.min(255, Math.max(LEAST_LIGHT, grey + (channel - grey) * BOOST))),
    );

    return `rgb(${r.toString()} ${g.toString()} ${b.toString()})`;
  });
};

export { lightsOfAFrame };
