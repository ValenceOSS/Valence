type Glow = { inputRange: number[]; outputRange: number[] };

const STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];

/**
 * How bright one segment of a spinning ring is over a turn of it, counted in ticks: dim until its
 * tick comes, fading up over part of a tick and staying lit for as many ticks as there are
 * segments, then fading back down, for a native animation to follow without being told each tick.
 *
 * @param at - Which segment, counting round from the top.
 * @param count - How many segments the ring has, a turn being twice as many ticks.
 * @param fadesFor - How much of a tick a fade takes.
 * @param dim - How bright a segment that is not lit is.
 * @param easing - How a fade eases between the two.
 * @returns The ticks and how bright it is at each, to interpolate between.
 */
const glowOverATurn = (
  at: number,
  count: number,
  fadesFor: number,
  dim: number,
  easing: (share: number) => number,
): Glow => {
  const rising = STEPS.map((step) => ({
    tick: at + step * fadesFor,
    glow: dim + (1 - dim) * easing(step),
  }));
  const falling = STEPS.map((step) => ({
    tick: at + count + step * fadesFor,
    glow: 1 - (1 - dim) * easing(step),
  }));
  const points = [
    ...(at > 0 ? [{ tick: 0, glow: dim }] : []),
    ...rising,
    ...falling,
    { tick: count * 2, glow: dim },
  ];

  return {
    inputRange: points.map((point) => point.tick),
    outputRange: points.map((point) => point.glow),
  };
};

export type { Glow };

export { glowOverATurn };
