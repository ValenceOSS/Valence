const HALF_HOUR_MS = 30 * 60 * 1000;

const SHOWN_MS = 4 * 60 * 60 * 1000;

/**
 * The span of the guide worth showing at a moment: from the start of the half hour it falls in, for
 * the next four hours — so everybody looking at the guide in the same half hour asks for the same
 * span, and shares the answer.
 *
 * @param now - The moment, in milliseconds.
 * @returns The span's start and end, in milliseconds.
 */
const liveWindowAt = (now: number): { from: number; until: number } => {
  const from = Math.floor(now / HALF_HOUR_MS) * HALF_HOUR_MS;

  return { from, until: from + SHOWN_MS };
};

export { liveWindowAt };
