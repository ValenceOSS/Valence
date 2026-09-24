import { describeListeningPlace } from '@ValenceClient/books/describeListeningPlace';
import type { Book, BookListening } from '@ValenceContracts/schemas/Book';

type StillListening = {
  book: Book;
  fraction: number;
  detail: string;
};

/**
 * The audiobooks somebody is partway through, in the order they were last heard, each with how far
 * through it they are and the chapter they are on and how long is left — what "continue listening"
 * shows.
 *
 * @param listenings - Where the watching profile has got to in every audiobook they have started.
 * @returns The ones they have not finished.
 */
const stillListening = (listenings: readonly BookListening[]): StillListening[] =>
  listenings
    .filter((listening) => !listening.isFinished)
    .map((listening) => ({
      book: listening.book,
      fraction:
        listening.durationSeconds > 0
          ? Math.min(listening.heardSeconds / listening.durationSeconds, 1)
          : 0,
      detail: describeListeningPlace(listening),
    }));

export type { StillListening };

export { stillListening };
