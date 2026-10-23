import { asc } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { hidden, library, mediaItem, rating, user, viewerProfile } from '#dialect/Schema';
import { carryOverViewing } from './carryOverViewing';

const STARTING_POSTGRES_MS = 60_000;

const LIBRARY_ID = '0b6f3a52-2a0c-4f7e-9d7b-1f3a7c2b8e11';

/**
 * A film's row, as little of one as the tables that hang off it need.
 *
 * @param id - Which film.
 * @param path - Where its file is.
 * @returns The row.
 */
const aFilm = (id: string, path: string) => ({
  id,
  libraryId: LIBRARY_ID,
  path,
  title: 'A Film',
  sizeBytes: 1,
  modifiedAtMs: 1,
  container: 'mkv',
  durationSeconds: 6000,
  videoCodec: 'h264',
  videoRange: 'SDR',
  width: 1920,
  height: 1080,
  audioStreams: [],
  subtitleStreams: [],
});

describe('carryOverViewing', { timeout: STARTING_POSTGRES_MS }, () => {
  it('moves ratings and hidden marks across, leaving any a viewer already has on the new copy', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values({ id: LIBRARY_ID, name: 'Films', kind: 'movies', path: '/f' });
    await db.insert(mediaItem).values([aFilm('old', '/f/old.mkv'), aFilm('new', '/f/new.mkv')]);
    await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
    await db.insert(viewerProfile).values([
      { id: 'first', userId: 'ada', name: 'Ada', colour: 'pink' },
      { id: 'second', userId: 'ada', name: 'Bea', colour: 'blue' },
    ]);
    await db.insert(rating).values([
      { id: 'r1', profileId: 'first', mediaItemId: 'old', stars: 4 },
      { id: 'r2', profileId: 'second', mediaItemId: 'old', stars: 2 },
      { id: 'r3', profileId: 'second', mediaItemId: 'new', stars: 5 },
    ]);
    await db.insert(hidden).values({ id: 'h1', profileId: 'first', mediaItemId: 'old' });

    await carryOverViewing(db, [{ from: 'old', to: 'new' }]);

    await expect(
      db
        .select({ id: rating.id, mediaItemId: rating.mediaItemId, stars: rating.stars })
        .from(rating)
        .orderBy(asc(rating.id)),
    ).resolves.toEqual([
      { id: 'r1', mediaItemId: 'new', stars: 4 },
      { id: 'r2', mediaItemId: 'old', stars: 2 },
      { id: 'r3', mediaItemId: 'new', stars: 5 },
    ]);
    await expect(db.select({ mediaItemId: hidden.mediaItemId }).from(hidden)).resolves.toEqual([
      { mediaItemId: 'new' },
    ]);
  });

  it('does nothing where nothing is succeeded', async () => {
    const db = await aMigratedDatabase();

    await expect(carryOverViewing(db, [])).resolves.toBeUndefined();
  });
});
