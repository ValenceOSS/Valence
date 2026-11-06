import { fisheyeAt } from './fisheyeAt';
import { placeOnWall } from './placeOnWall';
import type { WallCell, WallGrid, WallLens, WallPoint } from './PosterWall.types';

const MARGIN = 0.25;

/**
 * Whether a place on the wall is drawn anywhere on the screen, or near enough its edge to be about
 * to be, once the lens has shrunk it and pulled it in towards the middle.
 *
 * @param cell - The place.
 * @param at - Where the wall has been moved to.
 * @param grid - The wall's layout.
 * @param lens - How strongly the wall falls away.
 * @param screen - How wide and tall the screen is.
 * @returns Whether it should be drawn.
 */
const isOnScreen = (
  cell: WallCell,
  at: WallPoint,
  grid: WallGrid,
  lens: WallLens,
  screen: { width: number; height: number },
): boolean => {
  const place = placeOnWall(cell, grid);
  const seen = fisheyeAt(place.x - at.x, place.y - at.y, lens);
  const reachX = screen.width / 2 + grid.tileWidth * (seen.scale / 2 + MARGIN);
  const reachY = screen.height / 2 + grid.tileHeight * (seen.scale / 2 + MARGIN);

  return Math.abs(seen.x) <= reachX && Math.abs(seen.y) <= reachY;
};

export { isOnScreen };
