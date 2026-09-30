/**
 * Recovers the artwork of an icon, with its own transparency, from two renders that differ only in
 * the background behind it: one on black and one on white.
 *
 * Where the two agree nothing of the background showed through, so the artwork is solid there;
 * where they differ by the whole range it is not there at all. Everything between, the glass, the
 * soft edges and the shadow, comes out as the part of it that lets the background through, which is
 * what a picture laid over another background needs.
 *
 * @param onBlack - The render on black, three bytes a pixel.
 * @param onWhite - The same render on white, three bytes a pixel.
 * @returns The artwork, four bytes a pixel, not premultiplied.
 */
const matteOf = (onBlack: Uint8Array, onWhite: Uint8Array): Buffer => {
  const pixels = onBlack.length / 3;
  const out = Buffer.alloc(pixels * 4);

  for (let pixel = 0; pixel < pixels; pixel += 1) {
    let showing = 0;

    for (let channel = 0; channel < 3; channel += 1) {
      showing += (onWhite[pixel * 3 + channel] ?? 0) - (onBlack[pixel * 3 + channel] ?? 0);
    }

    const alpha = Math.min(1, Math.max(0, 1 - showing / (3 * 255)));

    for (let channel = 0; channel < 3; channel += 1) {
      out[pixel * 4 + channel] =
        alpha === 0 ? 0 : Math.min(255, Math.round((onBlack[pixel * 3 + channel] ?? 0) / alpha));
    }

    out[pixel * 4 + 3] = Math.round(alpha * 255);
  }

  return out;
};

export { matteOf };
