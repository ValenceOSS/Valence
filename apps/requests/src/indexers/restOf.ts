const MINUTE = 60_000;

const RESTS = [5, 15, 30, 60, 180, 360, 720, 1440].map((minutes) => minutes * MINUTE);

/**
 * How long an indexer that keeps failing rests before it is asked again: five minutes after the
 * failure that set it resting, then longer after each failure that follows, up to a day.
 *
 * @param failuresPast - How many failures in a row it has had beyond the ones that set it resting.
 * @returns The rest, in milliseconds.
 */
const restOf = (failuresPast: number): number =>
  RESTS[Math.min(Math.max(failuresPast, 0), RESTS.length - 1)] ?? MINUTE;

export { restOf };
