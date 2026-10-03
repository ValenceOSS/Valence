import { eq } from 'drizzle-orm';
import { book, bookChapter } from '#dialect/Schema';
import { BookContentsSchema } from '@ValenceContracts/schemas/Book';
import { readLinkedAddress } from '@ValenceServer/linking/catalogue/readLinkedAddress';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { BookPageBytes } from '@ValenceServer/books/BookFile';
import type { BookContents } from '@ValenceContracts/schemas/Book';
import type { LinkedAsker } from './createLinkedAsker';

type ReadsBooks = {
  readPage: (chapterId: string, page: number, width?: number) => Promise<BookPageBytes | null>;
  readContents: (chapterId: string) => Promise<BookContents | null>;
  readDocument: (
    chapterId: string,
    part: number,
    addressFor: (href: string) => string,
  ) => Promise<string | null>;
  readResource: (chapterId: string, href: string) => Promise<BookPageBytes | null>;
  readCover: (bookId: string) => Promise<BookPageBytes | null>;
};

/**
 * What came back, as the bytes of a page, a picture or a resource.
 *
 * @param answered - The answer.
 * @returns The bytes and their type, or nothing where there were none.
 */
const bytesOf = async (answered: Response | null): Promise<BookPageBytes | null> =>
  answered?.ok === true
    ? {
        bytes: new Uint8Array(await answered.arrayBuffer()),
        contentType: answered.headers.get('content-type') ?? 'application/octet-stream',
      }
    : null;

/**
 * Books that read this server's own as they always have, and a book a linked server shares by
 * asking that server for its cover, pages, contents and parts, which it reads from its own files
 * and this server passes on. A part that reflows is handed back with every address in it made this
 * server's, so a reader only ever asks the server it is signed in to.
 *
 * @param local - This server's own books.
 * @param db - The database, where each book and chapter is kept.
 * @param asker - How a linked server is asked.
 * @returns The books.
 */
const createLinkedBooks = <Books extends ReadsBooks>(
  local: Books,
  db: AnyValenceDatabase,
  asker: LinkedAsker,
): Books => {
  const chapterOf = async (chapterId: string) => {
    const [row] = await db
      .select({ path: bookChapter.path, bookId: bookChapter.bookId })
      .from(bookChapter)
      .where(eq(bookChapter.id, chapterId));

    return row === undefined || readLinkedAddress(row.path) === null ? null : row;
  };

  return {
    ...local,

    readPage: async (chapterId, page, width) => {
      const linked = await chapterOf(chapterId);

      return linked === null
        ? local.readPage(chapterId, page, width)
        : bytesOf(
            await asker.askAt(
              `${linked.path}/pages/${page.toString()}${width === undefined ? '' : `?width=${width.toString()}`}`,
            ),
          );
    },

    readContents: async (chapterId) => {
      const linked = await chapterOf(chapterId);

      if (linked === null) {
        return local.readContents(chapterId);
      }

      const answered = await asker.askAt(`${linked.path}/contents`);
      const read =
        answered?.ok === true ? BookContentsSchema.safeParse(await answered.json()) : null;

      return read?.success === true ? read.data : null;
    },

    readDocument: async (chapterId, part, addressFor) => {
      const linked = await chapterOf(chapterId);

      if (linked === null) {
        return local.readDocument(chapterId, part, addressFor);
      }

      const answered = await asker.askAt(`${linked.path}/document?part=${part.toString()}`);
      const remote = readLinkedAddress(linked.path)?.route;
      const here = addressFor('').replace(/\/resource\?href=$/u, '');

      return answered?.ok === true && remote !== undefined
        ? (await answered.text()).replaceAll(remote, here)
        : null;
    },

    readResource: async (chapterId, href) => {
      const linked = await chapterOf(chapterId);

      return linked === null
        ? local.readResource(chapterId, href)
        : bytesOf(await asker.askAt(`${linked.path}/resource?href=${encodeURIComponent(href)}`));
    },

    readCover: async (bookId) => {
      const [row] = await db.select({ path: book.path }).from(book).where(eq(book.id, bookId));

      return row === undefined || readLinkedAddress(row.path) === null
        ? local.readCover(bookId)
        : bytesOf(await asker.askAt(`${row.path}/cover`));
    },
  };
};

export type { ReadsBooks };

export { createLinkedBooks };
