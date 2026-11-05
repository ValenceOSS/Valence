import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, seasonSource, series } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { seasonSourcesOfFile } from './seasonSourcesOfFile';

const STARTING_THE_DATABASE_MS = 60_000;

describe('seasonSourcesOfFile', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('reads the seasons of a file’s programme read from elsewhere, with its season', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values({ id: 'lib', name: 'Shows', kind: 'shows', path: '/shows' });
    await db.insert(series).values([
      { id: 'kept', libraryId: 'lib', key: 'folder:/shows/Old', title: 'Old' },
      { id: 'loose', libraryId: 'lib', key: 'title:loose', title: 'Loose' },
    ]);
    await db.insert(mediaItem).values([
      {
        ...aMediaItemRow('episode', 'lib'),
        seriesId: 'kept',
        seriesTitle: 'Old',
        seasonNumber: 7,
      },
      {
        ...aMediaItemRow('loose', 'lib'),
        seriesId: 'loose',
        seriesTitle: 'Loose',
        seasonNumber: 1,
      },
      aMediaItemRow('film', 'lib'),
    ]);
    await db.insert(seasonSource).values({
      seriesId: 'kept',
      seasonNumber: 7,
      externalId: '900',
      externalSeason: 1,
      title: 'Old',
      year: 2026,
    });

    await expect(seasonSourcesOfFile(db, 'episode')).resolves.toEqual({
      libraryId: 'lib',
      seriesId: 'kept',
      seasonNumber: 7,
      sources: [
        {
          folder: '/shows/Old',
          seasonNumber: 7,
          externalId: '900',
          externalSeason: 1,
          title: 'Old',
          year: 2026,
        },
      ],
    });
    await expect(seasonSourcesOfFile(db, 'loose')).resolves.toBeNull();
    await expect(seasonSourcesOfFile(db, 'film')).resolves.toBeNull();
    await expect(seasonSourcesOfFile(db, 'nothing')).resolves.toBeNull();
  });
});
