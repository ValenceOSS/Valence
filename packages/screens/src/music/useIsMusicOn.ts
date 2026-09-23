import { useSyncExternalStore } from 'react';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';

/**
 * Whether music is coming out of this device's speakers right now — which is what anything else that
 * would make a sound, like a preview under the pointer, stays quiet for.
 *
 * @param player - The player to ask, which is the window's own unless a test says otherwise.
 * @returns Whether music is playing here.
 */
const useIsMusicOn = (player: MusicPlayer = theMusicPlayer()): boolean => {
  const isOn = () => {
    const { isPlaying, remote } = player.read();

    return isPlaying && remote === null;
  };

  return useSyncExternalStore(player.subscribe, isOn, isOn);
};

export { useIsMusicOn };
