import { useCallback, useSyncExternalStore } from 'react';
import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';

/**
 * Which of the book's chapters is playing, drawing again only as a new one begins rather than
 * every time the book moves on.
 *
 * @param player - The player to read, which is the client's own unless a test says otherwise.
 * @returns Where the chapter is in the book's chapters, or -1 where there are none.
 */
const useChapterPlaying = (player: AudiobookPlayer = theAudiobookPlayer()): number => {
  const read = useCallback(() => chapterPlaying(player.read()), [player]);

  return useSyncExternalStore(player.subscribe, read, read);
};

export { useChapterPlaying };
