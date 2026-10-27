const READY_AHEAD_SECONDS = 45;

/**
 * Whether the episode playing is near enough its end to make the next one ready: late enough that a
 * session started now is not held for long, early enough that it is ready before the end.
 *
 * @param positionSeconds - Where the episode playing is.
 * @param durationSeconds - How long it is.
 * @returns Whether to make the next one ready now.
 */
const isTimeToReadyAhead = (positionSeconds: number, durationSeconds: number): boolean =>
  durationSeconds > READY_AHEAD_SECONDS * 2 &&
  positionSeconds >= durationSeconds - READY_AHEAD_SECONDS &&
  positionSeconds < durationSeconds;

export { isTimeToReadyAhead };
