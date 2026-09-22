import type { VideoPlayer } from 'expo-video';

/**
 * Silences a player, or lets it be heard.
 *
 * @param player - The player.
 * @param isMuted - Whether it is silent.
 */
const hushThePlayer = (player: VideoPlayer, isMuted: boolean): void => {
  player.muted = isMuted;
};

export { hushThePlayer };
