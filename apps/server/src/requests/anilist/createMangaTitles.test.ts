import { describe, expect, it, vi } from 'vitest';
import { createMangaTitles } from './createMangaTitles';

const FLOWER = {
  data: {
    Media: {
      title: {
        english: 'The Fragrant Flower Blooms With Dignity',
        romaji: 'Kaoru Hana wa Rin to Saku',
        native: '薫る花は凛と咲く',
      },
    },
  },
};

describe('createMangaTitles', () => {
  it('names a volume in English, keeping the romaji and the original to search by', async () => {
    const titles = createMangaTitles({ post: () => Promise.resolve(FLOWER) });

    expect(await titles.of('薫る花は凛と咲く 2')).toEqual({
      title: 'The Fragrant Flower Blooms With Dignity Vol. 2',
      aliases: ['Kaoru Hana wa Rin to Saku Vol. 2', '薫る花は凛と咲く 2'],
    });
  });

  it('asks AniList once for every volume of a series in a search, and leaves the rest alone', async () => {
    const post = vi.fn(() => Promise.resolve(FLOWER));
    const titles = createMangaTitles({ post });

    expect(
      (
        await titles.retitled([
          { title: '薫る花は凛と咲く 1' },
          { title: '薫る花は凛と咲く 6' },
          { title: 'Dune' },
        ])
      ).map((book) => book.title),
    ).toEqual([
      'The Fragrant Flower Blooms With Dignity Vol. 1',
      'The Fragrant Flower Blooms With Dignity Vol. 6',
      'Dune',
    ]);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('leaves a volume as it was where AniList does not know the series', async () => {
    const titles = createMangaTitles({ post: () => Promise.resolve(null) });

    expect(await titles.of('薫る花は凛と咲く 1')).toBeNull();
  });
});
