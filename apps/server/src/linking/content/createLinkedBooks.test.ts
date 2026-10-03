import { describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { book, bookChapter, library } from '#dialect/Schema';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { createLinkedBooks } from './createLinkedBooks';
import type { ReadsBooks } from './createLinkedBooks';

const STARTING_THE_DATABASE_MS = 60_000;

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const AT = `linked://${FILMS}/api/books/remote-book`;

const CHAPTER_AT = `${AT}/chapters/remote-chapter`;

const MINE = { bytes: new Uint8Array([9]), contentType: 'image/jpeg' };

const aLocal = () => ({
  readPage: vi.fn<ReadsBooks['readPage']>(() => Promise.resolve(MINE)),
  readContents: vi.fn<ReadsBooks['readContents']>(() => Promise.resolve(null)),
  readDocument: vi.fn<ReadsBooks['readDocument']>(() => Promise.resolve('mine')),
  readResource: vi.fn<ReadsBooks['readResource']>(() => Promise.resolve(MINE)),
  readCover: vi.fn<ReadsBooks['readCover']>(() => Promise.resolve(MINE)),
});

/**
 * A database holding a book of this server's own and one a linked server shares, a chapter each.
 *
 * @returns The database.
 */
const holdingBothBooks = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values({ id: 'books', name: 'Books', kind: 'books', path: '/b' });
  await db.insert(book).values([
    {
      id: 'theirs',
      libraryId: 'books',
      path: AT,
      title: 'Dune',
      layout: 'fixed',
      direction: 'leftToRight',
    },
    {
      id: 'mine',
      libraryId: 'books',
      path: '/b/mine.cbz',
      title: 'Mine',
      layout: 'fixed',
      direction: 'leftToRight',
    },
  ]);
  await db.insert(bookChapter).values([
    {
      id: 'their-chapter',
      bookId: 'theirs',
      path: CHAPTER_AT,
      number: 1,
      title: 'One',
      format: 'epub',
      sizeBytes: 1,
      modifiedAtMs: 0,
    },
    {
      id: 'my-chapter',
      bookId: 'mine',
      path: '/b/mine.cbz',
      number: 1,
      title: 'One',
      format: 'cbz',
      sizeBytes: 1,
      modifiedAtMs: 0,
    },
  ]);

  return db;
};

describe('createLinkedBooks', () => {
  it(
    'reads this server’s own books as it always has',
    async () => {
      const local = aLocal();
      const books = createLinkedBooks(
        local,
        await holdingBothBooks(),
        aLinkedAskerAnswering(() => null),
      );

      expect(await books.readCover('mine')).toBe(MINE);
      expect(await books.readPage('my-chapter', 1)).toBe(MINE);
      expect(await books.readDocument('my-chapter', 0, (href) => href)).toBe('mine');
      expect(local.readResource).not.toHaveBeenCalled();
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'reads a linked book’s cover, pages and resources from the server that has it',
    async () => {
      const asker = aLinkedAskerAnswering(
        () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/webp' } }),
      );
      const books = createLinkedBooks(aLocal(), await holdingBothBooks(), asker);

      expect(await books.readCover('theirs')).toEqual({
        bytes: new Uint8Array([1]),
        contentType: 'image/webp',
      });
      await books.readPage('their-chapter', 3, 800);
      await books.readResource('their-chapter', 'images/one two.png');

      expect(asker.asked.map((one) => one.route)).toEqual([
        '/api/books/remote-book/cover',
        '/api/books/remote-book/chapters/remote-chapter/pages/3?width=800',
        '/api/books/remote-book/chapters/remote-chapter/resource?href=images%2Fone%20two.png',
      ]);
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'reads a linked book’s contents, and hands back a part with its addresses made this server’s',
    async () => {
      const remote = '/api/books/remote-book/chapters/remote-chapter';
      const asker = aLinkedAskerAnswering((_, route) =>
        route.endsWith('/contents')
          ? Response.json({ parts: [{ size: 10 }], contents: [] })
          : new Response(`<img src="${remote}/resource?href=a.png">`),
      );
      const books = createLinkedBooks(aLocal(), await holdingBothBooks(), asker);

      expect(await books.readContents('their-chapter')).toEqual({
        parts: [{ size: 10 }],
        contents: [],
      });
      expect(
        await books.readDocument(
          'their-chapter',
          0,
          (href) => `/api/books/theirs/chapters/their-chapter/resource?href=${href}`,
        ),
      ).toBe('<img src="/api/books/theirs/chapters/their-chapter/resource?href=a.png">');
    },
    STARTING_THE_DATABASE_MS,
  );
});
