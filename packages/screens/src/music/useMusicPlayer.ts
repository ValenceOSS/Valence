import { useSyncExternalStore } from 'react';
import { theMusicPlayer } from './theMusicPlayer';
import type { MusicPlayer, MusicPlayerState } from './createMusicPlayer';

/**
 * Reads the window's music player, drawing again whenever it changes.
 *
 * @param player - The player to read, which is the window's own unless a test says otherwise.
 * @returns What it is doing, and the player to tell what to do.
 */
const useMusicPlayer = (
  player: MusicPlayer = theMusicPlayer(),
): { state: MusicPlayerState; player: MusicPlayer } => {
  const state = useSyncExternalStore(player.subscribe, player.read, player.read);

  return { state, player };
};

export { useMusicPlayer };
