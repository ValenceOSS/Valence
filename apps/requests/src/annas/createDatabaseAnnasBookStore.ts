import { count, eq, inArray, sql } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { annasBook } from '#dialect/Schema';
import { annasBookMatches } from '#dialect/annasBookMatches';
import { searchWordsOf } from '@ValenceRequests/annas/searchWordsOf';
import type { RequestsDatabase } from '#dialect/RequestsDatabase';
import type { AnnasBookRecord } from '@ValenceRequests/annas/AnnasBookRecord';

const MOST_WORDS = 12;

/**
 * Anna's Archive's books as this service keeps them, to be searched without asking Anna's Archive:
 * kept a batch at a time, each found again by its md5, and searched by the words of its title and
 * author.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseAnnasBookStore = (db: RequestsDatabase) => ({
  keep: async (books: readonly AnnasBookRecord[]): Promise<void> => {
    if (books.length === 0) {
      return;
    }

    await upsert(db, annasBook, {
      values: [...books],
      target: annasBook.md5,
      set: {
        title: sql`excluded.title`,
        author: sql`excluded.author`,
        language: sql`excluded.language`,
        extension: sql`excluded.extension`,
        sizeBytes: sql`excluded.size_bytes`,
        year: sql`excluded.year`,
        coverUrl: sql`excluded.cover_url`,
        torrentGroup: sql`excluded.torrent_group`,
        torrent: sql`excluded.torrent`,
        fileInTorrent: sql`excluded.file_in_torrent`,
        searchKey: sql`excluded.search_key`,
      },
    });
  },

  find: async (md5: string): Promise<AnnasBookRecord | null> => {
    const [row] = await db.select().from(annasBook).where(eq(annasBook.md5, md5)).limit(1);

    return row ?? null;
  },

  findMany: async (md5s: readonly string[]): Promise<AnnasBookRecord[]> =>
    md5s.length === 0
      ? []
      : db
          .select()
          .from(annasBook)
          .where(inArray(annasBook.md5, [...md5s])),

  count: async (): Promise<number> => {
    const [counted] = await db.select({ books: count() }).from(annasBook);

    return Number(counted?.books ?? 0);
  },

  search: async (query: string, limit: number): Promise<AnnasBookRecord[]> => {
    const words = searchWordsOf(query).split(' ').filter(Boolean).slice(0, MOST_WORDS);

    if (words.length === 0) {
      return [];
    }

    const matches = annasBookMatches(words);

    return db.select().from(annasBook).where(matches.where).orderBy(matches.order).limit(limit);
  },
});

type AnnasBookStore = ReturnType<typeof createDatabaseAnnasBookStore>;

export type { AnnasBookStore };

export { createDatabaseAnnasBookStore };
