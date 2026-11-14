import { describe, expect, it } from 'vitest';
import { hidden, library, mediaItem, series } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { listSharingGenres } from './listSharingGenres';

const STARTING_POSTGRES_MS = 60_000;

describe('listSharingGenres', { timeout: STARTING_POSTGRES_MS }, () => {
  it('finds the films and programmes sharing two genres or more, most shared and best rated first', async () => {
    const { db, viewer } = await aHousehold();

    await db.insert(library).values({ id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' });
    await db.insert(series).values([
      { id: 'mystery-show', libraryId: 'shows', key: 'mystery', title: 'Mystery Show' },
      { id: 'own-show', libraryId: 'shows', key: 'own', title: 'Own Show' },
    ]);
    await db.insert(mediaItem).values([
      { ...aMediaItemRow('three', 'films'), genres: ['Crime', 'Drama', 'Mystery'] },
      { ...aMediaItemRow('two-rated', 'films'), genres: ['Crime', 'Drama'], rating: 8 },
      { ...aMediaItemRow('two', 'films'), genres: ['Crime', 'Drama'], rating: 6 },
      { ...aMediaItemRow('one', 'films'), genres: ['Crime', 'Romance'] },
      { ...aMediaItemRow('kept-away', 'films'), genres: ['Crime', 'Drama', 'Mystery'] },
      ...['e1', 'e2'].map((id) => ({
        ...aMediaItemRow(id, 'shows'),
        seriesId: 'mystery-show',
        seriesTitle: 'Mystery Show',
        genres: ['Drama', 'Mystery'],
      })),
      {
        ...aMediaItemRow('own-episode', 'shows'),
        seriesId: 'own-show',
        seriesTitle: 'Own Show',
        genres: ['Crime', 'Drama', 'Mystery'],
      },
    ]);
    await db.insert(hidden).values({ id: 'h', profileId: 'pat', mediaItemId: 'kept-away' });

    const found = await listSharingGenres(
      db,
      viewer,
      { id: 'own-episode', seriesId: 'own-show', genres: ['Crime', 'Drama', 'Mystery'] },
      10,
    );

    expect(found.map((one) => one.id)).toEqual(['three', 'two-rated', 'two', 'mystery-show']);
    expect(found[0]?.shared).toBe(3);
  });

  it('finds nothing for a title with fewer than two genres', async () => {
    const { db, viewer } = await aHousehold();

    await expect(
      listSharingGenres(db, viewer, { id: 'film', seriesId: null, genres: ['Drama'] }, 10),
    ).resolves.toEqual([]);
  });
});
