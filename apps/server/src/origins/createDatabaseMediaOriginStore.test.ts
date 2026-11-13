import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library } from '#dialect/Schema';
import { createDatabaseMediaOriginStore } from '@ValenceServer/origins/createDatabaseMediaOriginStore';

const STARTING_THE_DATABASE_MS = 60_000;

describe('createDatabaseMediaOriginStore', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('keeps the latest origin recorded, and leaves a known one where told to', async () => {
    const db = await aMigratedDatabase();
    const store = createDatabaseMediaOriginStore(db);

    await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });
    await store.record([
      { libraryId: 'films', path: '/films/Up.mkv', source: 'import', via: 'Plex' },
    ]);
    await store.record([
      { libraryId: 'films', path: '/films/Up.mkv', source: 'upload', via: null },
    ]);
    await store.recordUnlessKnown([
      { libraryId: 'films', path: '/films/Up.mkv', source: 'import', via: 'Jellyfin' },
      { libraryId: 'films', path: '/films/Heat.mkv', source: 'import', via: 'Jellyfin' },
    ]);

    expect(await store.read(['/films/Up.mkv', '/films/Heat.mkv', '/films/Alien.mkv'])).toEqual({
      '/films/Up.mkv': { source: 'upload', via: null },
      '/films/Heat.mkv': { source: 'import', via: 'Jellyfin' },
    });
    expect(await store.read([])).toEqual({});
  });
});
