/**
 * How far subtitles have been nudged from where the file puts them, as a player's settings name it.
 *
 * @param seconds - How far, later where it is more than nothing.
 * @returns "In time", or the nudge signed to two places.
 */
const describeSubtitleOffset = (seconds: number): string =>
  seconds === 0 ? 'In time' : `${seconds > 0 ? '+' : ''}${seconds.toFixed(2)}s`;

export { describeSubtitleOffset };
