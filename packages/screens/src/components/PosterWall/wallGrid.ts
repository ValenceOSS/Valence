import type { WallGrid } from './PosterWall.types';

const TILE_SHARE_OF_HEIGHT = 0.34;

const POSTER_RATIO = 2 / 3;

const SPACING = 1.1;

/**
 * How a wall of posters is laid out to fill a screen of a given shape: the size of a poster at the
 * focus, how far apart they stand, and as many columns as keep the whole wall about the shape of
 * the screen, every other row set half a poster along like a honeycomb.
 *
 * @param count - How many posters there are.
 * @param width - How wide the screen is.
 * @param height - How tall the screen is.
 * @returns The layout.
 */
const wallGrid = (count: number, width: number, height: number): WallGrid => {
  const tileHeight = Math.max(140, height * TILE_SHARE_OF_HEIGHT);
  const tileWidth = tileHeight * POSTER_RATIO;
  const stepX = tileWidth * SPACING;
  const stepY = tileHeight * SPACING;
  const columns = Math.max(
    1,
    Math.min(count, Math.ceil(Math.sqrt((count * (width / Math.max(1, height)) * stepY) / stepX))),
  );

  return {
    count,
    columns,
    rows: Math.max(1, Math.ceil(count / columns)),
    tileWidth,
    tileHeight,
    stepX,
    stepY,
  };
};

export { wallGrid };
