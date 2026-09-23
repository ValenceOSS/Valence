import { useSyncExternalStore } from 'react';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';

/**
 * The phone's music player, and what it is doing now, kept current as it changes.
 *
 * @returns The player, to tell it what to do, and its state, to draw.
 */
const useTheMusic = (): { player: MusicPlayer; state: MusicPlayerState } => {
  const player = thePhonesMusicPlayer();
  const state = useSyncExternalStore(player.subscribe, player.read);

  return { player, state };
};

export { useTheMusic };
