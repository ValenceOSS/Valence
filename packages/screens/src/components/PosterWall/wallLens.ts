import type { WallLens } from './PosterWall.types';

/**
 * How strongly the wall is drawn smaller towards its edges on a screen of a given size: how large
 * the poster in the middle is, how small the farthest ones get, and how far out the falling off
 * is halfway done.
 *
 * @param width - How wide the screen is.
 * @param height - How tall the screen is.
 * @returns The lens.
 */
const wallLens = (width: number, height: number): WallLens => ({
  least: 0.32,
  most: 1.12,
  radius: Math.max(120, Math.min(width, height) * 0.4),
});

export { wallLens };
