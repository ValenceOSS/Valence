import type { Book, BookChapter, BookDetail } from '@ValenceContracts/schemas/Book';

const BOOK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0b';

/**
 * A book to hear in two tracks, the second marking two chapters inside itself, to draw a screen
 * against.
 *
 * @param overrides - Anything about the book that matters to the test.
 * @returns The book and its chapters.
 */
const anAudiobook = (overrides: Partial<Book> = {}): BookDetail => {
  const book: Book = {
    id: BOOK_ID,
    libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
    title: 'Red Rising',
    layout: 'audio',
    direction: 'leftToRight',
    year: 2014,
    overview: null,
    genres: null,
    authors: ['Pierce Brown'],
    rating: null,
    hasCover: true,
    chapterCount: 2,
    hasText: false,
    hasAudio: true,
    addedAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
    ...overrides,
  };
  const chapter = (n: number, extra: Partial<BookChapter>): BookChapter => ({
    id: `6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0c0${n.toString()}`,
    bookId: book.id,
    number: n,
    title: `Part ${n.toString()}`,
    format: 'm4b',
    pageCount: null,
    durationSeconds: 600,
    marks: [],
    addedAt: book.addedAt,
    ...extra,
  });

  return {
    book,
    chapters: [
      chapter(2, {
        marks: [
          { title: 'The Institute', startSeconds: 0, endSeconds: 300 },
          { title: 'The Passage', startSeconds: 300, endSeconds: 600 },
        ],
      }),
      chapter(1, {}),
    ],
  };
};

export { anAudiobook };
