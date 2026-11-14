/**
 * A square picture of a filled white circle on nothing, its edge softened over one pixel, for
 * cutting an icon down to a circle.
 *
 * @param pixels - The width and height.
 * @returns The picture as raw RGBA bytes.
 */
const circleMask = (pixels: number): Buffer => {
  const mask = Buffer.alloc(pixels * pixels * 4);
  const centre = pixels / 2;

  for (let y = 0; y < pixels; y += 1) {
    for (let x = 0; x < pixels; x += 1) {
      const distance = Math.hypot(x + 0.5 - centre, y + 0.5 - centre);
      const alpha = Math.round(Math.min(1, Math.max(0, centre - distance + 0.5)) * 255);
      const at = (y * pixels + x) * 4;

      mask[at] = 255;
      mask[at + 1] = 255;
      mask[at + 2] = 255;
      mask[at + 3] = alpha;
    }
  }

  return mask;
};

export { circleMask };
