import type { VideoPlayer } from 'expo-video';

/**
 * Plays a video louder or quieter, which is how expo-video's player is told its volume.
 *
 * @param player - The video's player.
 * @param level - How loud to play it, from silent at nought to full at one.
 */
const turnTheVideoTo = (player: Pick<VideoPlayer, 'volume'>, level: number): void => {
  player.volume = level;
};

export { turnTheVideoTo };
