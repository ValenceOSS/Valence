import type { VideoPlayer } from 'expo-video';

/**
 * Plays a video faster or slower, which is how expo-video's player is told its speed.
 *
 * @param player - The video's player.
 * @param speed - How much faster than normal to play it.
 */
const playTheVideoAt = (player: Pick<VideoPlayer, 'playbackRate'>, speed: number): void => {
  player.playbackRate = speed;
};

export { playTheVideoAt };
