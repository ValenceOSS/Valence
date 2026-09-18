import { queryOptions } from '@tanstack/react-query';
import {
  fetchBook,
  fetchBookContents,
  fetchBookDocument,
  fetchBooks,
  fetchReadingProgress,
} from '@ValenceClient/books/fetchBooks';

const BOOKS = ['books'] as const;

/**
 * The books on a shelf.
 *
 * @param libraryId - Which shelf.
 * @returns The query.
 */
const inLibrary = (libraryId: string) =>
  queryOptions({
    queryKey: [...BOOKS, 'library', libraryId],
    queryFn: () => fetchBooks(libraryId),
  });

/**
 * One book and its chapters.
 *
 * @param bookId - The book.
 * @returns The query.
 */
const one = (bookId: string) =>
  queryOptions({
    queryKey: [...BOOKS, 'one', bookId],
    queryFn: () => fetchBook(bookId),
  });

/**
 * Where this profile is up to in a book.
 *
 * @param bookId - The book.
 * @returns The query.
 */
const progress = (bookId: string) =>
  queryOptions({
    queryKey: [...BOOKS, 'progress', bookId],
    queryFn: () => fetchReadingProgress(bookId),
  });

/**
 * How a book that reflows is divided. A file does not change while it is being read, so this is
 * kept for as long as the page is open.
 *
 * @param bookId - The book.
 * @param chapterId - The file it is in.
 * @returns The query.
 */
const contents = (bookId: string, chapterId: string) =>
  queryOptions({
    queryKey: [...BOOKS, 'contents', bookId, chapterId],
    queryFn: () => fetchBookContents(bookId, chapterId),
    staleTime: Infinity,
  });

/**
 * One part of a book that reflows, kept for as long as the page is open for the same reason.
 *
 * @param bookId - The book.
 * @param chapterId - The file it is in.
 * @param part - Which part.
 * @returns The query.
 */
const document = (bookId: string, chapterId: string, part: number) =>
  queryOptions({
    queryKey: [...BOOKS, 'document', bookId, chapterId, part],
    queryFn: () => fetchBookDocument(bookId, chapterId, part),
    staleTime: Infinity,
  });

const bookQueries = { inLibrary, one, progress, contents, document, key: BOOKS };

export { bookQueries };
