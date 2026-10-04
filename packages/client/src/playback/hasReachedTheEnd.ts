const WITHIN_SECONDS = 0.25;

/**
 * Whether playback has reached the end of the film, whether or not the video element says so.
 *
 * A transcode's playlist is as long as the file's container, and a container is as long as its
 * longest track — often a subtitle or a sound track running a few seconds past the picture. The
 * engine plays the picture out, waits for the seconds the playlist promised, asks for the last
 * segment again, and appends it after itself: the last few seconds play over and over while the clock
 * climbs, and the element never ends. Reaching the length the film was catalogued at is the end,
 * whatever the element makes of it.
 *
 * @param positionSeconds - Where playback is.
 * @param durationSeconds - How long the film is, or nothing usable where it is not yet known.
 * @returns Whether it has played to the end.
 */
const hasReachedTheEnd = (positionSeconds: number, durationSeconds: number): boolean =>
  Number.isFinite(durationSeconds) &&
  durationSeconds > 0 &&
  positionSeconds >= durationSeconds - WITHIN_SECONDS;

export { hasReachedTheEnd };
