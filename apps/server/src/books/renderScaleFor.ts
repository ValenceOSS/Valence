const MOST_PIXELS = 40_000_000;

/**
 * Works out how far to scale a page so that drawing it stays inside a budget of pixels.
 *
 * @param bounds - The page's left, top, right and bottom edges, in points.
 * @param wanted - The scale the page would be drawn at if it were of an ordinary size.
 * @returns The scale to draw at: the one wanted, or smaller where the page is so large that it would
 *   need more pixels than the budget, or nothing where the page has no usable size.
 */
const renderScaleFor = (
  bounds: readonly [number, number, number, number],
  wanted: number,
): number | null => {
  const width = Math.abs(bounds[2] - bounds[0]);
  const height = Math.abs(bounds[3] - bounds[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width === 0 || height === 0) {
    return null;
  }

  return Math.min(wanted, Math.sqrt(MOST_PIXELS / (width * height)));
};

export { renderScaleFor };
