const LEAST_LIGHT = 40;

const BOOST = 1.35;

/**
 * Reads the colour of each cell of a grid laid over a frame, which is what the glow around the
 * picture is drawn from. Each is the average of the pixels in it, pushed a little brighter and further
 * from grey so that a dim scene still gives a glow that can be seen, and never so dark that it is not
 * there.
 *
 * @param pixels - The frame's pixels, four bytes to each: red, green, blue, alpha.
 * @param width - How many pixels wide the frame is.
 * @param height - How many pixels high it is.
 * @param columns - How many cells across.
 * @param rows - How many cells down.
 * @param reach - How many neighbouring cells each way are blended into each, so a small dark patch at
 *   the edge does not darken its light alone.
 * @returns A colour for each cell, row by row from the top left, as CSS.
 */
const lightsOfAFrame = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  columns = 2,
  rows = 2,
  reach = 0,
): string[] => {
  const totals = Array.from({ length: columns * rows }, () => ({
    red: 0,
    green: 0,
    blue: 0,
    count: 0,
  }));

  for (let y = 0; y < height; y += 1) {
    const row = Math.min(rows - 1, Math.floor((y * rows) / height));

    for (let x = 0; x < width; x += 1) {
      const cell = totals[row * columns + Math.min(columns - 1, Math.floor((x * columns) / width))];
      const at = (y * width + x) * 4;

      if (cell !== undefined) {
        cell.red += pixels[at] ?? 0;
        cell.green += pixels[at + 1] ?? 0;
        cell.blue += pixels[at + 2] ?? 0;
        cell.count += 1;
      }
    }
  }

  const blended = totals.map((_, cell) => {
    const column = cell % columns;
    const row = Math.floor(cell / columns);
    const sum = { red: 0, green: 0, blue: 0, count: 0 };

    for (let y = Math.max(0, row - reach); y <= Math.min(rows - 1, row + reach); y += 1) {
      for (
        let x = Math.max(0, column - reach);
        x <= Math.min(columns - 1, column + reach);
        x += 1
      ) {
        const near = totals[y * columns + x];

        if (near !== undefined) {
          sum.red += near.red;
          sum.green += near.green;
          sum.blue += near.blue;
          sum.count += near.count;
        }
      }
    }

    return sum;
  });

  return blended.map(({ red, green, blue, count }) => {
    const average = count === 0 ? [0, 0, 0] : [red / count, green / count, blue / count];
    const grey = ((average[0] ?? 0) + (average[1] ?? 0) + (average[2] ?? 0)) / 3;

    const [r = 0, g = 0, b = 0] = average.map((channel) =>
      Math.round(Math.min(255, Math.max(LEAST_LIGHT, grey + (channel - grey) * BOOST))),
    );

    return `rgb(${r.toString()} ${g.toString()} ${b.toString()})`;
  });
};

export { lightsOfAFrame };
