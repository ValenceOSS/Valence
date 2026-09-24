import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import type { AudiobookTrack } from '@ValenceClient/books/createAudiobookPlayer';
import type { BookChapter } from '@ValenceContracts/schemas/Book';

/**
 * The tracks a book is listened to by: its chapters that are sound rather than text, in the order
 * they are numbered, each with how long it lasts and the chapters it marks inside itself.
 *
 * @param chapters - The book's chapters.
 * @returns Its tracks, in order.
 */
const tracksOf = (chapters: readonly BookChapter[]): AudiobookTrack[] =>
  chapters
    .filter((chapter) => isAudiobookFormat(chapter.format))
    .sort((left, right) => left.number - right.number)
    .map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      durationSeconds: chapter.durationSeconds ?? 0,
      marks: chapter.marks ?? [],
    }));

export { tracksOf };
