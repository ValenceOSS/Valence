import type { VideoPlayer } from 'expo-video';

/**
 * Sets how fast a player plays.
 *
 * @param player - The player.
 * @param rate - How fast, one being as it was made.
 */
const setThePace = (player: VideoPlayer, rate: number): void => {
  player.playbackRate = rate;
};

export { setThePace };
