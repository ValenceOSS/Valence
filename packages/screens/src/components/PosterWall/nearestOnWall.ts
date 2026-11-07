import { placeOnWall } from './placeOnWall';
import type { WallCell, WallGrid, WallPoint } from './PosterWall.types';

/**
 * Which place on the wall is closest to a point, among the rows either side of it.
 *
 * @param point - The point, measured as the wall's places are.
 * @param grid - The wall's layout.
 * @returns The row and column.
 */
const nearestOnWall = (point: WallPoint, grid: WallGrid): WallCell => {
  const middleRow = Math.round(point.y / grid.stepY);
  let best: WallCell = { row: middleRow, column: 0 };
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let row = middleRow - 1; row <= middleRow + 1; row += 1) {
    const shift = Math.abs(row % 2) === 1 ? grid.stepX / 2 : 0;
    const cell = { row, column: Math.round((point.x - shift) / grid.stepX) };
    const place = placeOnWall(cell, grid);
    const distance = Math.hypot(place.x - point.x, place.y - point.y);

    if (distance < bestDistance) {
      best = cell;
      bestDistance = distance;
    }
  }

  return best;
};

export { nearestOnWall };
