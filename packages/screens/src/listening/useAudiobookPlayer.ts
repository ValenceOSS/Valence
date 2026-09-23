import { useSyncExternalStore } from 'react';
import { theAudiobookPlayer } from './theAudiobookPlayer';
import type {
  AudiobookPlayer,
  AudiobookPlayerState,
} from '@ValenceClient/books/createAudiobookPlayer';

/**
 * Reads the window's audiobook player, drawing again whenever it changes.
 *
 * @param player - The player to read, which is the window's own unless a test says otherwise.
 * @returns What it is doing, and the player to tell what to do.
 */
const useAudiobookPlayer = (
  player: AudiobookPlayer = theAudiobookPlayer(),
): { state: AudiobookPlayerState; player: AudiobookPlayer } => {
  const state = useSyncExternalStore(player.subscribe, player.read, player.read);

  return { state, player };
};

export { useAudiobookPlayer };
