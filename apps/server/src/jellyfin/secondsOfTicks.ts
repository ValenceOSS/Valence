import { TICKS_PER_SECOND } from '@ValenceServer/jellyfin/ticksOf';

/**
 * Turns Jellyfin's ticks back into seconds.
 *
 * @param ticks - How long, in ticks.
 * @returns The same length in seconds.
 */
const secondsOfTicks = (ticks: number): number => ticks / TICKS_PER_SECOND;

export { secondsOfTicks };
