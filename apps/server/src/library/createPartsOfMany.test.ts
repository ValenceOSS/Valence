import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, mediaPart } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createPartsOfMany } from './createPartsOfMany';

const STARTING_POSTGRES_MS = 60_000;

const ONE = '/media/films/Film - cd1.mkv';

const TWO = '/media/films/Film - cd2.mkv';

describe('createPartsOfMany', { timeout: STARTING_POSTGRES_MS }, () => {
  it('finds the parts of every film asked about at once, and nothing for any other path', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values([
      { id: 'media', name: 'Everything', kind: 'movies', path: '/media' },
      { id: 'films', name: 'Films', kind: 'movies', path: '/media/films' },
    ]);

    for (const [id, libraryId] of [
      ['outer', 'media'],
      ['inner', 'films'],
    ] as const) {
      await db.insert(mediaItem).values({ ...aMediaItemRow(id, libraryId), path: ONE });
      await db.insert(mediaPart).values(
        [ONE, TWO].map((path, at) => ({
          mediaItemId: id,
          position: at + 1,
          path,
          sizeBytes: 1,
          modifiedAtMs: 1,
          durationSeconds: 60,
        })),
      );
    }

    const found = await createPartsOfMany(db)([ONE, TWO, '/media/films/Other.mkv']);

    expect([...found]).toEqual([
      [
        ONE,
        [
          { path: ONE, durationSeconds: 60 },
          { path: TWO, durationSeconds: 60 },
        ],
      ],
    ]);
    await expect(createPartsOfMany(db)([])).resolves.toEqual(new Map());
  });
});
