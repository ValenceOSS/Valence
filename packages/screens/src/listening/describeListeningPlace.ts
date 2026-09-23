import type { BookListening } from '@ValenceContracts/schemas/Book';

/**
 * Says how long is left of something, in hours and minutes, the way a person would round it.
 *
 * @param seconds - How long is left.
 * @returns The words.
 */
const describeLeft = (seconds: number): string => {
  const minutes = Math.max(Math.round(seconds / 60), 1);
  const hours = Math.floor(minutes / 60);
  const over = minutes % 60;

  if (hours === 0) {
    return `${minutes.toString()} min left`;
  }

  return over === 0
    ? `${hours.toString()} h left`
    : `${hours.toString()} h ${over.toString()} min left`;
};

/**
 * Says how far into an audiobook somebody got: the chapter they are on, and how long is left of
 * the whole book.
 *
 * @param listening - Where they are in it.
 * @returns What to say.
 */
const describeListeningPlace = (listening: BookListening): string =>
  `${listening.chapterTitle} · ${describeLeft(listening.durationSeconds - listening.heardSeconds)}`;

export { describeListeningPlace };
