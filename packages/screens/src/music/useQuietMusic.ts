import { useEffect } from 'react';
import { theMusicPlayer } from './theMusicPlayer';
import type { MusicPlayer } from './createMusicPlayer';

/**
 * Pauses the music playing on this device when something else is about to make sound — a film
 * starting — so the two never play over each other. Music playing on another device is left alone:
 * that is somebody else's speakers.
 *
 * @param player - The player to pause, which is the window's own unless a test says otherwise.
 */
const useQuietMusic = (player: MusicPlayer = theMusicPlayer()): void => {
  useEffect(() => {
    const { isPlaying, remote } = player.read();

    if (isPlaying && remote === null) {
      player.pause();
    }
  }, [player]);
};

export { useQuietMusic };
