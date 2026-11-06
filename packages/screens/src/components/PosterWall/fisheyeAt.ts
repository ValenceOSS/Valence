import type { WallLens } from './PosterWall.types';

/**
 * How a poster is drawn for how far it is from the middle of the screen, the way a watch draws its
 * apps: largest in the middle and smaller the further out it is.
 *
 * A poster is drawn at its own scale, and its distance from the middle is everything between it and
 * the middle drawn at theirs, which is what keeps the gaps between neighbours in step with the
 * posters either side of them all the way out rather than crowding the middle and scattering the
 * edges.
 *
 * @param dx - How far across from the middle it is on the wall.
 * @param dy - How far down from the middle it is on the wall.
 * @param lens - How strongly the wall falls away.
 * @returns Where it is drawn from the middle, and how large.
 */
const fisheyeAt = (dx: number, dy: number, lens: WallLens) => {
  const away = Math.hypot(dx, dy);
  const spread = lens.most - lens.least;
  const scale = lens.least + spread / (1 + (away / lens.radius) ** 2);

  if (away === 0) {
    return { x: 0, y: 0, scale, away: 0 };
  }

  const drawnAway = lens.least * away + spread * lens.radius * Math.atan(away / lens.radius);

  return { x: (dx / away) * drawnAway, y: (dy / away) * drawnAway, scale, away: drawnAway };
};

export { fisheyeAt };
