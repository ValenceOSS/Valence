import type { LiquidState } from './LiquidFill.types';

const LEVEL_PULL = 0.018;

const LEVEL_DRAG = 0.9;

const SURFACE_PULL = 0.01;

const SURFACE_DRAG = 0.05;

const SPREAD = 0.12;

const FRAME_SECONDS = 1 / 60;

const WAVES = [
  { length: 1.4, speed: 1.1, size: 1 },
  { length: 0.75, speed: -1.7, size: 0.55 },
  { length: 0.45, speed: 2.6, size: 0.3 },
] as const;

/**
 * The swell across a surface: three waves of different lengths running at different speeds, two
 * one way and one the other, so they cross and build and cancel and the surface never takes the
 * same shape twice, nor pivots about one point.
 *
 * @param into - Where each point's swell is written.
 * @param seconds - How long the liquid has been moving.
 * @param phases - Where each wave starts, different for every liquid.
 * @param size - How tall the tallest wave is, in pixels.
 * @param pace - How fast this surface's waves run against the other's.
 * @returns Nothing; the swell is written in place.
 */
const swellAcross = (
  into: number[],
  seconds: number,
  phases: readonly number[],
  size: number,
  pace: number,
): void => {
  for (let index = 0; index < into.length; index += 1) {
    const along = index / Math.max(1, into.length - 1);

    into[index] = WAVES.reduce(
      (sum, wave, which) =>
        sum +
        wave.size *
          size *
          Math.sin(
            (2 * Math.PI * along) / wave.length +
              wave.speed * pace * seconds +
              (phases[which] ?? 0),
          ),
      0,
    );
  }
};

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
 * and settling as poured water does, both surfaces swell, and any ripple settles, with a nudge now
 * and then at a random point. A fuller tile swells and is nudged harder, so a busy core's water is
 * livelier than an idle one's.
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

  const strength = height * (0.008 + target * 0.012);

  if (random() < 0.04) {
    const at = Math.floor(random() * state.speeds.length);

    state.speeds[at] = (state.speeds[at] ?? 0) + (random() - 0.5) * strength;
  }

  if (random() < 0.03) {
    const at = Math.floor(random() * state.backSpeeds.length);

    state.backSpeeds[at] = (state.backSpeeds[at] ?? 0) + (random() - 0.5) * strength;
  }

  settleSurface(state.heights, state.speeds);
  settleSurface(state.back, state.backSpeeds);

  state.seconds += FRAME_SECONDS;

  const swell = height * (0.018 + target * 0.018);

  swellAcross(state.swell, state.seconds, state.phases.slice(0, 3), swell, 1);
  swellAcross(state.backSwell, state.seconds, state.phases.slice(3), swell * 0.8, -0.8);
};

export { stepLiquid };
