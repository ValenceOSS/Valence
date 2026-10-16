const FADE_SECONDS = 1;

/**
 * How loud and bright an episode has become since it began playing, after one that faded into it:
 * rising from nothing to whole over its first second, so the next episode fades in as the last one
 * faded out.
 *
 * @param playedSeconds - How long it has played since it began.
 * @returns How much of it can be seen and heard, from 0 for none to 1 for all of it.
 */
const fadeAfterTheStart = (playedSeconds: number): number =>
  Math.min(1, Math.max(0, playedSeconds / FADE_SECONDS));

export { fadeAfterTheStart };
