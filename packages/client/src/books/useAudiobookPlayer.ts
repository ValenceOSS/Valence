import { useCallback, useRef, useSyncExternalStore } from 'react';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import type {
  AudiobookPlayer,
  AudiobookPlayerState,
} from '@ValenceClient/books/createAudiobookPlayer';

type Following = {
  followsPosition?: boolean;
};

/**
 * Reads the client's audiobook player, drawing again whenever it changes.
 *
 * Where the book has got to moves several times a second while it plays, and most of what shows a
 * book playing does not show that, so by default a change in the position alone draws nothing
 * again; only what shows where the book has got to asks to follow it.
 *
 * @param player - The player to read, which is the client's own unless a test says otherwise.
 * @param following - Whether to draw again as the book's position moves.
 * @returns What it is doing, and the player to tell what to do.
 */
const useAudiobookPlayer = (
  player: AudiobookPlayer = theAudiobookPlayer(),
  { followsPosition = true }: Following = {},
): { state: AudiobookPlayerState; player: AudiobookPlayer } => {
  const drawnRef = useRef<AudiobookPlayerState | null>(null);

  const read = useCallback((): AudiobookPlayerState => {
    const now = player.read();
    const drawn = drawnRef.current;

    if (
      followsPosition ||
      drawn === null ||
      drawn.book !== now.book ||
      drawn.trackAt !== now.trackAt ||
      drawn.isPlaying !== now.isPlaying ||
      drawn.isLoading !== now.isLoading ||
      drawn.speed !== now.speed ||
      drawn.sleep !== now.sleep ||
      drawn.problem !== now.problem
    ) {
      drawnRef.current = now;

      return now;
    }

    return drawn;
  }, [player, followsPosition]);

  const state = useSyncExternalStore(player.subscribe, read, read);

  return { state, player };
};

export { useAudiobookPlayer };
