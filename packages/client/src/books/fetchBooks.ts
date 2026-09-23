import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { readFromServerOrAbsent } from '@ValenceClient/query/readFromServerOrAbsent';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import {
  BookContentsSchema,
  BookDetailSchema,
  BookReadingListSchema,
  BookSchema,
  ReadingProgressSchema,
} from '@ValenceContracts/schemas/Book';
import type {
  Book,
  BookContents,
  BookDetail,
  BookReading,
  ReadingProgress,
} from '@ValenceContracts/schemas/Book';

const BookListSchema = z.object({ books: z.array(BookSchema) });

const ProgressListSchema = z.object({ progress: z.array(ReadingProgressSchema) });

/**
 * Books across every library this viewer can see, by what somebody typed or by id.
 *
 * @param query - What to look for: some words, or the ids of the books wanted.
 * @returns The books found.
 */
const findBooks = async (query: {
  search?: string;
  ids?: readonly string[];
  limit?: number;
}): Promise<Book[]> => {
  const asked = new URLSearchParams();

  if (query.search !== undefined) {
    asked.set('search', query.search);
  }

  if (query.ids !== undefined) {
    asked.set('ids', query.ids.join(','));
  }

  if (query.limit !== undefined) {
    asked.set('limit', query.limit.toString());
  }

  return (await readFromServer(`/api/books?${asked.toString()}`, BookListSchema, profileHeaders()))
    .books;
};

/**
 * What this profile has been reading, a book at a time, most recent first.
 *
 * @returns Each book and where in it they are.
 */
const fetchReading = async (): Promise<BookReading[]> =>
  (await readFromServer('/api/reading', BookReadingListSchema, profileHeaders())).readings;

/**
 * Forgets where this profile is up to — in one book, or in all of them.
 *
 * @param bookId - The book, or nothing for every book.
 * @returns Whether the server forgot it.
 */
const forgetReading = async (bookId?: string): Promise<boolean> => {
  const response = await fetch(
    bookId === undefined ? '/api/reading' : `/api/books/${bookId}/progress`,
    {
      method: 'DELETE',
      headers: profileHeaders(),
    },
  ).catch(() => null);

  return response !== null && response.ok;
};

/**
 * The books on a shelf.
 *
 * @param libraryId - Which shelf.
 * @returns What is on it.
 */
const fetchBooks = async (libraryId: string): Promise<Book[]> =>
  (await readFromServer(`/api/libraries/${libraryId}/books`, BookListSchema, profileHeaders()))
    .books;

/**
 * One book and the chapters in it.
 *
 * @param bookId - The book.
 * @returns The book, or nothing where the shelf no longer holds it.
 */
const fetchBook = (bookId: string): Promise<BookDetail | null> =>
  readFromServerOrAbsent(`/api/books/${bookId}`, BookDetailSchema, profileHeaders());

/**
 * Where this profile is up to in a book.
 *
 * @param bookId - The book.
 * @returns Where they are in each chapter they have opened.
 */
const fetchReadingProgress = async (bookId: string): Promise<ReadingProgress[]> =>
  (await readFromServer(`/api/books/${bookId}/progress`, ProgressListSchema, profileHeaders()))
    .progress;

/**
 * Remembers where somebody is up to.
 *
 * Sent without waiting on it and without minding whether it lands. Somebody turning a page is
 * telling Valence something, not asking it: a page that stopped to be sure the place had been written
 * would be a page that stutters, and a place that failed to save costs a reader one turn next time.
 *
 * A page of a comic is a place a book has; a place in reflowing text is only a fraction of the way
 * through, because how many pages it makes depends on the screen.
 *
 * @param bookId - The book.
 * @param chapterId - The chapter they are in.
 * @param place - Which page they are on, or how far through the text.
 * @param isFinished - Whether that was the last of it.
 * @returns Whether it was written.
 */
const saveReadingProgress = async (
  bookId: string,
  chapterId: string,
  place: { pageNumber: number } | { fraction: number },
  isFinished = false,
): Promise<boolean> => {
  const response = await fetch(`/api/books/${bookId}/chapters/${chapterId}/progress`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...profileHeaders() },
    body: JSON.stringify({
      pageNumber: 'pageNumber' in place ? place.pageNumber : null,
      fraction: 'fraction' in place ? place.fraction : null,
      isFinished,
    }),
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * How a book that reflows is divided: how much each part holds, and its table of contents.
 *
 * @param bookId - The book.
 * @param chapterId - The file it is in.
 * @returns How it is divided, or nothing where it is not a book that reflows.
 */
const fetchBookContents = (bookId: string, chapterId: string): Promise<BookContents | null> =>
  readFromServerOrAbsent(`/api/books/${bookId}/chapters/${chapterId}/contents`, BookContentsSchema);

/**
 * One part of a book that reflows, as the server has cleaned it: HTML with nothing in it that runs.
 *
 * @param bookId - The book.
 * @param chapterId - The file it is in.
 * @param part - Which part, counting from zero.
 * @returns The part, or nothing where the book has no such part.
 */
const fetchBookDocument = async (
  bookId: string,
  chapterId: string,
  part: number,
): Promise<string | null> => {
  const path = `/api/books/${bookId}/chapters/${chapterId}/document?part=${part.toString()}`;
  const response = await fetch(path, { headers: { accept: 'text/html', ...profileHeaders() } });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new RequestFailed(path, response.status);
  }

  return response.text();
};

/**
 * Where to find one page of a chapter.
 *
 * The width is asked for rather than left to the browser, because a page out of a volume is
 * megabytes of picture and a phone will draw it a thousand pixels wide. The server keeps each width
 * it is asked for, so a screen that asks the same question twice pays once.
 *
 * @param bookId - The book.
 * @param chapterId - The chapter.
 * @param page - Which page, counting from zero.
 * @param width - How wide it will be drawn, where that is known.
 * @returns The address.
 */
const bookPageUrl = (bookId: string, chapterId: string, page: number, width?: number): string => {
  const at = `/api/books/${bookId}/chapters/${chapterId}/pages/${page.toString()}`;

  return width === undefined ? at : `${at}?width=${Math.round(width).toString()}`;
};

/**
 * Where to find the cover of a book.
 *
 * @param bookId - The book.
 * @returns The address.
 */
const bookCoverUrl = (bookId: string): string => `/api/books/${bookId}/cover`;

export {
  bookCoverUrl,
  bookPageUrl,
  fetchBook,
  fetchBookContents,
  fetchBookDocument,
  fetchBooks,
  fetchReading,
  fetchReadingProgress,
  findBooks,
  forgetReading,
  saveReadingProgress,
};
