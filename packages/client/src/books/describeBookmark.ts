import { bookPageUrl, bookResourceUrl } from '@ValenceClient/books/fetchBooks';
import { say } from '@ValenceI18n/say';
import type { Bookmark } from '@ValenceContracts/schemas/Book';

type DescribedBookmark = {
  id: string;
  place: string;
  chapter: string | null;
  excerpt: string | null;
  picture: string | null;
};

/**
 * How a bookmark reads in a list of them: its page, or how far through the text it is with the page
 * the reader showed there when it was made; its chapter,
 * where the book has more than one; the words that start there; and the address of a picture of
 * the page, or of the picture it falls on.
 *
 * @param bookmark - The bookmark.
 * @param chapters - The book's chapters, to name the bookmark's by.
 * @param pictureWidth - How wide a picture of a page will be drawn.
 * @returns How it reads.
 */
const describeBookmark = (
  bookmark: Bookmark,
  chapters: readonly { id: string; title: string }[],
  pictureWidth: number,
): DescribedBookmark => {
  const percent = Math.round((bookmark.fraction ?? 0) * 100);
  const chapter =
    chapters.length > 1
      ? (chapters.find((one) => one.id === bookmark.chapterId)?.title ?? null)
      : null;

  return {
    id: bookmark.id,
    place:
      bookmark.pageNumber !== null
        ? say('common.pageValue', { value: (bookmark.pageNumber + 1).toString() })
        : bookmark.pageShown === null
          ? say('common.percent', { value: percent.toString() })
          : say('common.pageAndPercent', {
              page: bookmark.pageShown.toString(),
              percent: percent.toString(),
            }),
    chapter,
    excerpt: bookmark.excerpt,
    picture:
      bookmark.pageNumber !== null
        ? bookPageUrl(bookmark.bookId, bookmark.chapterId, bookmark.pageNumber, pictureWidth)
        : bookmark.picture === null
          ? null
          : bookResourceUrl(bookmark.bookId, bookmark.chapterId, bookmark.picture),
  };
};

export type { DescribedBookmark };

export { describeBookmark };
