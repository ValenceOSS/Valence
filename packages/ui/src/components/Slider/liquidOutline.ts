const SPREAD_PX = 7;

const STEP_PX = 2;

const CORNER_PX = 2;

/**
 * Traces the outline of a chapter of the timeline as a liquid one: a band of a given thickness
 * that bulges smoothly where the pointer rests, the bulge falling away along a bell curve so it
 * meets the band in soft necks rather than corners, and carries on into a neighbouring chapter
 * when the pointer is near its edge. The ends keep their small rounding.
 *
 * @param width - How wide the chapter is.
 * @param height - How tall the box drawing it is, which the outline is centred in.
 * @param thickness - How thick the band is.
 * @param rise - How far the bulge stands out beyond the band, above and below.
 * @param at - Where the pointer rests, measured from the chapter's start, which may lie outside it.
 * @returns A CSS `path()` to clip the chapter to.
 */
const liquidOutline = (
  width: number,
  height: number,
  thickness: number,
  rise: number,
  at: number,
): string => {
  const middle = height / 2;
  const half = (x: number) =>
    thickness / 2 + rise * Math.exp(-((x - at) ** 2) / (2 * SPREAD_PX * SPREAD_PX));
  const corner = Math.min(CORNER_PX, thickness / 2, width / 2);
  const along: number[] = [];

  for (let x = corner; x < width - corner; x += STEP_PX) {
    along.push(x);
  }

  along.push(width - corner);

  const top = (x: number) => (middle - half(x)).toFixed(2);
  const bottom = (x: number) => (middle + half(x)).toFixed(2);
  const end = width.toFixed(2);
  const upper = along.map((x) => `L ${x.toFixed(2)} ${top(x)}`).join(' ');
  const lower = [...along]
    .reverse()
    .map((x) => `L ${x.toFixed(2)} ${bottom(x)}`)
    .join(' ');

  return `path('M 0 ${(middle - half(0) + corner).toFixed(2)} Q 0 ${top(0)} ${corner.toFixed(2)} ${top(corner)} ${upper} Q ${end} ${top(width)} ${end} ${(middle - half(width) + corner).toFixed(2)} L ${end} ${(middle + half(width) - corner).toFixed(2)} Q ${end} ${bottom(width)} ${(width - corner).toFixed(2)} ${bottom(width - corner)} ${lower} Q 0 ${bottom(0)} 0 ${(middle + half(0) - corner).toFixed(2)} Z')`;
};

export { liquidOutline };
