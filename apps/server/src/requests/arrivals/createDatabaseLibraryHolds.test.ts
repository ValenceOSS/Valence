import { describe, expect, it } from 'vitest';
import { musicAlbum, musicArtist, series } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseLibraryHolds } from './createDatabaseLibraryHolds';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseLibraryHolds', { timeout: STARTING_POSTGRES_MS }, () => {
  it('says which films, series and albums are still held, each kind apart', async () => {
    const { db } = await aHousehold();

    await db
      .insert(series)
      .values({ id: 'show', libraryId: 'films', key: 'show', title: 'Show', externalId: '1' });
    await db.insert(musicArtist).values({
      id: 'kate',
      libraryId: 'music',
      name: 'Kate Bush',
      nameKey: 'kate bush',
      sortName: 'Bush, Kate',
    });
    await db.insert(musicAlbum).values({
      id: 'hounds',
      libraryId: 'music',
      artistId: 'kate',
      title: 'Hounds of Love',
      titleKey: 'hounds of love',
    });

    const holds = createDatabaseLibraryHolds(db);

    expect([...(await holds('film', ['film', 'gone', 'show']))]).toEqual(['film']);
    expect([...(await holds('series', ['show', 'film']))]).toEqual(['show']);
    expect([...(await holds('album', ['hounds', 'gone']))]).toEqual(['hounds']);
    expect([...(await holds('film', []))]).toEqual([]);
  });
});
