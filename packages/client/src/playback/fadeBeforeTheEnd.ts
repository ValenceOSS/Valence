import { hasReachedTheEnd } from '@ValenceClient/playback/hasReachedTheEnd';

const FADE_SECONDS = 1.5;

const AT_THE_END_SECONDS = 0.25;

/**
 * How loud and bright an episode still is as it nears its end, when the next one will follow on
 * its own: whole until the last moment and a half, then falling to nothing as it reaches the end,
 * so one episode fades into the next rather than cutting to it.
 *
 * @param positionSeconds - Where it has got to.
 * @param durationSeconds - How long it is.
 * @returns How much of it is left to see and hear, from 1 for all of it to 0 for none.
 */
const fadeBeforeTheEnd = (positionSeconds: number, durationSeconds: number): number => {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 1;
  }

  if (hasReachedTheEnd(positionSeconds, durationSeconds)) {
    return 0;
  }

  const left = durationSeconds - AT_THE_END_SECONDS - positionSeconds;

  return Math.min(1, Math.max(0, left / FADE_SECONDS));
};

export { fadeBeforeTheEnd };
