import { readFromServer } from '@ValenceClient/query/readFromServer';
import { BookmarkListSchema } from '@ValenceContracts/schemas/Book';
import type { Bookmark, SaveBookmark } from '@ValenceContracts/schemas/Book';

type BookmarkAnswer = 'done' | 'refused' | 'unreachable';

/**
 * The places this profile has marked in a book.
 *
 * @param bookId - The book.
 * @returns Its bookmarks, in the order they come in the book.
 */
const fetchBookmarks = async (bookId: string): Promise<Bookmark[]> =>
  (await readFromServer(`/api/books/${bookId}/bookmarks`, BookmarkListSchema)).bookmarks;

/**
 * Says how a change to a bookmark was answered: done, refused for good, or not heard at all and
 * worth sending again later.
 *
 * @param response - What came back, or nothing where nothing did.
 * @returns How it went.
 */
const answerOf = (response: Response | null): BookmarkAnswer => {
  if (response === null || response.status >= 500 || response.status === 401) {
    return 'unreachable';
  }

  return response.ok ? 'done' : 'refused';
};

/**
 * Marks a place in a book, under the bookmark's own id so that sending it twice marks it once.
 *
 * @param bookmark - The bookmark.
 * @returns How the server answered.
 */
const saveBookmark = async (bookmark: Bookmark): Promise<BookmarkAnswer> => {
  const marked: SaveBookmark = {
    chapterId: bookmark.chapterId,
    pageNumber: bookmark.pageNumber,
    fraction: bookmark.fraction,
    pageShown: bookmark.pageShown,
    excerpt: bookmark.excerpt,
    picture: bookmark.picture,
  };

  return answerOf(
    await fetch(`/api/books/${bookmark.bookId}/bookmarks/${bookmark.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(marked),
    }).catch(() => null),
  );
};

/**
 * Takes a bookmark away.
 *
 * @param bookId - The book it is in.
 * @param bookmarkId - The bookmark.
 * @returns How the server answered.
 */
const forgetBookmark = async (bookId: string, bookmarkId: string): Promise<BookmarkAnswer> =>
  answerOf(
    await fetch(`/api/books/${bookId}/bookmarks/${bookmarkId}`, { method: 'DELETE' }).catch(
      () => null,
    ),
  );

export type { BookmarkAnswer };

export { fetchBookmarks, forgetBookmark, saveBookmark };
