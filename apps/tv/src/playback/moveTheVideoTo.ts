import type { VideoPlayer } from 'expo-video';

/**
 * Moves a video to a point in it, which is how expo-video's player is told where to play from.
 *
 * @param player - The video's player.
 * @param seconds - Where to move it to.
 */
const moveTheVideoTo = (player: Pick<VideoPlayer, 'currentTime'>, seconds: number): void => {
  player.currentTime = seconds;
};

export { moveTheVideoTo };
