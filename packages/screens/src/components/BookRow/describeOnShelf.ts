import type { Book } from '@ValenceContracts/schemas/Book';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * What goes under a book on a shelf: who wrote an ebook or an audiobook, or how many chapters a
 * comic has.
 *
 * @param book - The book.
 * @returns The line under its cover.
 */
const describeOnShelf = (book: Book): string =>
  book.layout === 'reflow' || book.layout === 'audio'
    ? book.authors === null || book.authors.length === 0
      ? book.layout === 'audio'
        ? say('common.audiobook')
        : say('common.ebook')
      : book.authors.join(', ')
    : sayCount('common.count.chapters', book.chapterCount);

export { describeOnShelf };
