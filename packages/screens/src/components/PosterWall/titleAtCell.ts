import type { WallCell, WallGrid } from './PosterWall.types';

/**
 * Which title stands at a place on the wall. The titles repeat across and down, so the wall never
 * runs out however far it is moved.
 *
 * @param cell - The row and column.
 * @param grid - The wall's layout.
 * @returns Where in the titles it is, or -1 where there are none.
 */
const titleAtCell = ({ row, column }: WallCell, grid: WallGrid): number => {
  if (grid.count === 0) {
    return -1;
  }

  const wrappedRow = ((row % grid.rows) + grid.rows) % grid.rows;
  const wrappedColumn = ((column % grid.columns) + grid.columns) % grid.columns;

  return (wrappedRow * grid.columns + wrappedColumn) % grid.count;
};

export { titleAtCell };
