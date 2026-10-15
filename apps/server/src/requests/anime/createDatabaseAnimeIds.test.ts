import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { library, series } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseAnimeIds } from './createDatabaseAnimeIds';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseAnimeIds', { timeout: STARTING_POSTGRES_MS }, () => {
  it("lists the anime libraries' series not looked up lately, and keeps their ids", async () => {
    const { db } = await aHousehold();
    const before = new Date('2026-10-01T00:00:00.000Z');

    await db.insert(library).values({ id: 'anime', name: 'Anime', kind: 'anime', path: '/anime' });
    await db.insert(series).values([
      { id: 'new', libraryId: 'anime', key: 'new', title: 'New', externalId: '7' },
      {
        id: 'old',
        libraryId: 'anime',
        key: 'old',
        title: 'Old',
        externalId: '8',
        animeIdsCheckedAt: new Date('2026-09-01T00:00:00.000Z'),
      },
      {
        id: 'recent',
        libraryId: 'anime',
        key: 'recent',
        title: 'Recent',
        externalId: '9',
        animeIdsCheckedAt: new Date('2026-10-10T00:00:00.000Z'),
      },
      {
        id: 'unmatched',
        libraryId: 'anime',
        key: 'unmatched',
        title: 'Unmatched',
        externalId: null,
      },
      { id: 'film', libraryId: 'films', key: 'film', title: 'Film', externalId: '10' },
    ]);

    const ids = createDatabaseAnimeIds(db);

    expect((await ids.unchecked(before, 10)).map((one) => one.id).toSorted()).toEqual([
      'new',
      'old',
    ]);

    await ids.keep('new', { anilistId: 1, malId: 2 }, before);

    expect(
      await db
        .select({ anilistId: series.anilistId, malId: series.malId })
        .from(series)
        .where(eq(series.id, 'new')),
    ).toEqual([{ anilistId: 1, malId: 2 }]);
    expect((await ids.unchecked(before, 10)).map((one) => one.id)).toEqual(['old']);
  });
});
