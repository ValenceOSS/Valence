import { describe, expect, it } from 'vitest';
import { aScratchDatabase } from '#dialect/aScratchDatabase';
import { createDatabaseAnnasBookStore } from './createDatabaseAnnasBookStore';
import type { AnnasBookRecord } from './AnnasBookRecord';

const aBook = (md5: string, title: string, author: string): AnnasBookRecord => ({
  md5,
  title,
  author,
  language: 'en',
  extension: 'epub',
  sizeBytes: 1000,
  year: 1990,
  coverUrl: null,
  torrentGroup: 'libgen_rs_fic',
  torrent: 'f_381000.torrent',
  fileInTorrent: `381000/${md5}.epub`,
  searchKey: `${title} ${author}`.toLowerCase(),
});

describe('createDatabaseAnnasBookStore', () => {
  it('keeps books, finds them again, and writes over one kept twice', async () => {
    const store = createDatabaseAnnasBookStore(await aScratchDatabase());

    await store.keep([aBook('a'.repeat(32), 'The Eye of the World', 'Robert Jordan')]);
    await store.keep([aBook('a'.repeat(32), 'The Eye of the World', 'R. Jordan')]);

    expect(await store.count()).toBe(1);
    expect((await store.find('a'.repeat(32)))?.author).toBe('R. Jordan');
  });

  it('searches by every word of a title and author', async () => {
    const store = createDatabaseAnnasBookStore(await aScratchDatabase());

    await store.keep([
      aBook('a'.repeat(32), 'The Eye of the World', 'Robert Jordan'),
      aBook('b'.repeat(32), 'The Great Hunt', 'Robert Jordan'),
    ]);

    expect((await store.search('eye world jordan', 10)).map((book) => book.md5)).toEqual([
      'a'.repeat(32),
    ]);
    expect(await store.search('   ', 10)).toEqual([]);
  });
});
