import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createMemoryMediaOriginStore } from '@ValenceServer/origins/createMemoryMediaOriginStore';
import { rememberImportedFiles } from '@ValenceServer/imports/rememberImportedFiles';

const STARTING_THE_DATABASE_MS = 60_000;

describe('rememberImportedFiles', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('records each file an import matched as brought across from its source', async () => {
    const db = await aMigratedDatabase();
    const origins = createMemoryMediaOriginStore();

    await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });
    await db
      .insert(mediaItem)
      .values({ ...aMediaItemRow('heat', 'films'), path: '/films/Heat.mkv' });
    await rememberImportedFiles(
      db,
      origins,
      new Map([
        ['plex-1', { kind: 'item', mediaItemId: 'heat', by: 'path' }],
        ['plex-2', { kind: 'series', seriesId: 'show', by: 'id' }],
      ]),
      'Plex',
    );

    expect(await origins.read(['/films/Heat.mkv'])).toEqual({
      '/films/Heat.mkv': { source: 'import', via: 'Plex' },
    });
  });
});
