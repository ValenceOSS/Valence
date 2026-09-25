import { say } from '@ValenceI18n/say';

/**
 * How fast something plays, as a player's settings name it.
 *
 * @param rate - How fast, one being as it was made.
 * @returns "Normal", or the rate with an x after it.
 */
const describePlaybackRate = (rate: number): string =>
  rate === 1 ? say('client.describePlaybackRate.normal') : `${rate.toString()}x`;

export { describePlaybackRate };
