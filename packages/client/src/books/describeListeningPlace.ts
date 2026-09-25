import { describeLength } from '@ValenceClient/books/describeLength';
import type { BookListening } from '@ValenceContracts/schemas/Book';

/**
 * Says how far into an audiobook somebody got: the chapter they are on, and how long is left of
 * the whole book.
 *
 * @param listening - Where they are in it.
 * @returns What to say.
 */
const describeListeningPlace = (listening: BookListening): string =>
  `${listening.chapterTitle} · ${describeLength(listening.durationSeconds - listening.heardSeconds)} left`;

export { describeListeningPlace };
