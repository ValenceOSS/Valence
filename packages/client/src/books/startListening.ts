import { fetchListeningProgress } from '@ValenceClient/books/fetchListening';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import type { BookDetail } from '@ValenceContracts/schemas/Book';

/**
 * Starts listening to a book from wherever the watching profile left off in it, or from the
 * beginning where they have not started it or had finished it. A book already playing just carries
 * on rather than going back to where it was last kept.
 *
 * @param detail - The book and its chapters.
 * @param player - The player to play it on.
 * @param readPlace - Where the watching profile had got to in a book.
 * @returns Once it has started.
 */
const startListening = async (
  { book, chapters }: BookDetail,
  player: AudiobookPlayer,
  readPlace = fetchListeningProgress,
): Promise<void> => {
  if (player.read().book?.id === book.id) {
    player.play();

    return;
  }

  const tracks = tracksOf(chapters);

  if (tracks.length === 0) {
    return;
  }

  const place = await readPlace(book.id).catch(() => null);

  player.open(book, tracks, place === null || place.isFinished ? null : place);
};

export { startListening };
