const TICKS_PER_SECOND = 10_000_000;

/**
 * Turns Jellyfin's ticks, ten million to the second, into seconds.
 *
 * @param ticks - How long, in ticks, where Jellyfin said.
 * @returns The seconds, or nought where it did not.
 */
const secondsOfJellyfinTicks = (ticks: number | null | undefined): number =>
  ticks === null || ticks === undefined ? 0 : ticks / TICKS_PER_SECOND;

export { TICKS_PER_SECOND, secondsOfJellyfinTicks };
