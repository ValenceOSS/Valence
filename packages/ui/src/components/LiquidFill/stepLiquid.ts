import type { LiquidState } from './LiquidFill.types';

const LEVEL_PULL = 0.05;

const LEVEL_DRAG = 0.88;

const SURFACE_PULL = 0.03;

const SURFACE_DRAG = 0.035;

const SPREAD = 0.22;

/**
 * Moves one surface on by a frame: every point is pulled back towards rest and slowed, then
 * passes some of its height to its neighbours, which is what makes a nudge travel as a ripple and
 * two ripples meet rather than every point bobbing on its own.
 *
 * @param heights - How far each point stands above the level.
 * @param speeds - How fast each point is moving.
 * @returns Nothing; both are moved in place.
 */
const settleSurface = (heights: number[], speeds: number[]): void => {
  for (let index = 0; index < heights.length; index += 1) {
    const height = heights[index] ?? 0;
    const speed =
      (speeds[index] ?? 0) - height * SURFACE_PULL - (speeds[index] ?? 0) * SURFACE_DRAG;

    speeds[index] = speed;
    heights[index] = height + speed;
  }

  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 1; index < heights.length; index += 1) {
      const difference = SPREAD * ((heights[index] ?? 0) - (heights[index - 1] ?? 0));

      speeds[index - 1] = (speeds[index - 1] ?? 0) + difference;
      speeds[index] = (speeds[index] ?? 0) - difference;
    }
  }
};

/**
 * Moves a liquid on by a frame: the level springs towards where it is meant to be, overshooting
 * and settling as poured water does, and both surfaces settle, with a nudge now and then at a
 * random point so the water never quite stills. A fuller tile is nudged harder, so a busy core's
 * water is choppier than an idle one's.
 *
 * @param state - The liquid, moved in place.
 * @param target - Where the level is meant to be, from nothing to full.
 * @param height - How tall the tile is, in pixels, which scales how hard a nudge is.
 * @param random - Where chance comes from, so a test can fix it.
 * @returns Nothing; the state is moved in place.
 */
const stepLiquid = (
  state: LiquidState,
  target: number,
  height: number,
  random: () => number = Math.random,
): void => {
  state.levelSpeed = (state.levelSpeed + (target - state.level) * LEVEL_PULL) * LEVEL_DRAG;
  state.level += state.levelSpeed;

  const strength = height * (0.03 + target * 0.05);

  if (random() < 0.12) {
    const at = Math.floor(random() * state.speeds.length);

    state.speeds[at] = (state.speeds[at] ?? 0) + (random() - 0.5) * strength;
  }

  if (random() < 0.08) {
    const at = Math.floor(random() * state.backSpeeds.length);

    state.backSpeeds[at] = (state.backSpeeds[at] ?? 0) + (random() - 0.5) * strength;
  }

  settleSurface(state.heights, state.speeds);
  settleSurface(state.back, state.backSpeeds);
};

export { stepLiquid };
