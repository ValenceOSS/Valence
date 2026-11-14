const TICKS_PER_SECOND = 10_000_000;

/**
 * Turns seconds into Jellyfin's ticks, of which there are ten million to the second.
 *
 * @param seconds - How long.
 * @returns The same length in ticks, as a whole number.
 */
const ticksOf = (seconds: number): number => Math.round(seconds * TICKS_PER_SECOND);

export { TICKS_PER_SECOND, ticksOf };
