import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, mediaPart } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createPartsOf } from './createPartsOf';

const STARTING_POSTGRES_MS = 60_000;

describe('createPartsOf', { timeout: STARTING_POSTGRES_MS }, () => {
  it('finds a film’s parts in order from its first part, and nothing from any other path', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });
    await db
      .insert(mediaItem)
      .values({ ...aMediaItemRow('film', 'films'), path: '/films/Film - cd1.mkv' });
    await db.insert(mediaPart).values([
      {
        mediaItemId: 'film',
        position: 2,
        path: '/films/Film - cd2.mkv',
        sizeBytes: 1,
        modifiedAtMs: 1,
        durationSeconds: 2400,
      },
      {
        mediaItemId: 'film',
        position: 1,
        path: '/films/Film - cd1.mkv',
        sizeBytes: 1,
        modifiedAtMs: 1,
        durationSeconds: 3000,
      },
    ]);

    const partsOf = createPartsOf(db);

    await expect(partsOf('/films/Film - cd1.mkv')).resolves.toEqual([
      { path: '/films/Film - cd1.mkv', durationSeconds: 3000 },
      { path: '/films/Film - cd2.mkv', durationSeconds: 2400 },
    ]);
    await expect(partsOf('/films/Film - cd2.mkv')).resolves.toBeNull();
    await expect(partsOf('/films/Other.mkv')).resolves.toBeNull();
  });
});
