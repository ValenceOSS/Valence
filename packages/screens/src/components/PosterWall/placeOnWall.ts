import type { WallCell, WallGrid, WallPoint } from './PosterWall.types';

/**
 * Where one place on the wall has its centre, every other row set half a poster along. The wall
 * runs on for ever in every direction, so any row and column has a place.
 *
 * @param cell - The row and column.
 * @param grid - The wall's layout.
 * @returns Its centre, measured from the centre of the first.
 */
const placeOnWall = ({ row, column }: WallCell, grid: WallGrid): WallPoint => ({
  x: column * grid.stepX + (Math.abs(row % 2) === 1 ? grid.stepX / 2 : 0),
  y: row * grid.stepY,
});

export { placeOnWall };
