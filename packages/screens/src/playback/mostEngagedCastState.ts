import type { CastState } from './castPlayback.types';

const ENGAGEMENT: CastState[] = ['unavailable', 'available', 'connecting', 'connected'];

/**
 * Says where casting stands when there are two ways to cast, such as the desktop app's own
 * Chromecasts and the web view's AirPlay: whichever has gone further.
 *
 * @param one - Where one way stands.
 * @param other - Where the other stands.
 * @returns The further of the two.
 */
const mostEngagedCastState = (one: CastState, other: CastState): CastState =>
  ENGAGEMENT.indexOf(other) > ENGAGEMENT.indexOf(one) ? other : one;

export { mostEngagedCastState };
