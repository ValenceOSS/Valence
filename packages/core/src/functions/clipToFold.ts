import type { CurlFold, CurlPoint } from '@ValenceCore/functions/pageCurl.types';

/**
 * Cuts a shape along a crease and keeps one side of it: the side the corner was carried away
 * from, which is the flap that folds over, or the side it was carried towards, which is the page
 * that stays where it was.
 *
 * @param polygon - The shape, its corners in order.
 * @param fold - The crease.
 * @param side - Which side to keep: `'flap'` for the corner's side, `'rest'` for the other.
 * @returns The part kept, its corners in order, empty where nothing of the shape is on that side.
 */
const clipToFold = (
  polygon: readonly CurlPoint[],
  fold: CurlFold,
  side: 'flap' | 'rest',
): CurlPoint[] => {
  const sign = side === 'rest' ? 1 : -1;
  const reach = (point: CurlPoint): number =>
    sign * ((point.x - fold.at.x) * fold.normal.x + (point.y - fold.at.y) * fold.normal.y);

  return polygon.flatMap((point, at) => {
    const next = polygon[(at + 1) % polygon.length] ?? point;
    const here = reach(point);
    const there = reach(next);
    const kept = here >= 0 ? [point] : [];

    if (here >= 0 === there >= 0) {
      return kept;
    }

    const share = here / (here - there);

    return [
      ...kept,
      { x: point.x + (next.x - point.x) * share, y: point.y + (next.y - point.y) * share },
    ];
  });
};

export { clipToFold };
