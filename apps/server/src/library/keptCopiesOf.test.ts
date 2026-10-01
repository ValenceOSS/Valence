import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, mediaRendition } from '#dialect/Schema';
import { createMediaStore } from './createMediaStore';
import { keptCopiesOf } from './keptCopiesOf';

const STARTING_POSTGRES_MS = 60_000;

const FILMS_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

/**
 * A film as the scan would store it.
 *
 * @param id - The film.
 * @returns The row.
 */
const aFilm = (id: string): typeof mediaItem.$inferInsert => ({
  id,
  libraryId: FILMS_ID,
  path: `/films/${id}/${id}.mkv`,
  title: id,
  sizeBytes: 1,
  modifiedAtMs: 1,
  container: 'mkv',
  durationSeconds: 60,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  width: 3840,
  height: 2160,
  audioStreams: [],
  subtitleStreams: [],
});

/**
 * A copy kept alongside a film.
 *
 * @param mediaItemId - The film.
 * @param path - Where the copy is.
 * @returns The row.
 */
const aCopy = (mediaItemId: string, path: string): typeof mediaRendition.$inferInsert => ({
  id: crypto.randomUUID(),
  mediaItemId,
  path,
  label: '1080p H.264',
  sizeBytes: 1,
  container: 'mp4',
  durationSeconds: 60,
  bitrateKbps: 4000,
  videoCodec: 'h264',
  videoRange: 'SDR',
  width: 1920,
  height: 1080,
  audioStreams: [],
  subtitleStreams: [],
});

/**
 * A library of two films, each with a copy kept alongside: one beside it, one in the Valence folder.
 *
 * @returns The database.
 */
const twoFilmsWithCopies = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values({ id: FILMS_ID, name: 'Films', kind: 'movies', path: '/films' });
  await db.insert(mediaItem).values([aFilm('arrival'), aFilm('alien')]);
  await db
    .insert(mediaRendition)
    .values([
      aCopy('arrival', '/films/arrival/arrival - 1080p H264.valence.mp4'),
      aCopy('alien', '/films/.valence/0b5c.mp4'),
    ]);

  return db;
};

describe('keptCopiesOf', () => {
  it(
    'finds the copies of only the items asked about',
    async () => {
      const db = await twoFilmsWithCopies();

      await expect(keptCopiesOf(db, eq(mediaItem.id, 'arrival'))).resolves.toEqual([
        '/films/arrival/arrival - 1080p H264.valence.mp4',
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'has a film that vanished from the disk take its copies with it',
    async () => {
      const db = await twoFilmsWithCopies();
      const forget = vi.fn(() => Promise.resolve());
      const store = createMediaStore(db, () => Promise.resolve('GB'), forget);

      await store.removeByPaths(FILMS_ID, ['/films/arrival/arrival.mkv']);

      expect(forget).toHaveBeenCalledWith(['/films/arrival/arrival - 1080p H264.valence.mp4']);
      await expect(
        db.select({ id: mediaRendition.mediaItemId }).from(mediaRendition),
      ).resolves.toEqual([{ id: 'alien' }]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'has a library cleared for a rebuild take every copy with it',
    async () => {
      const db = await twoFilmsWithCopies();
      const forgotten: string[] = [];
      const store = createMediaStore(
        db,
        () => Promise.resolve('GB'),
        (paths) => {
          forgotten.push(...paths);

          return Promise.resolve();
        },
      );

      await store.clear(FILMS_ID);

      expect(forgotten.toSorted()).toEqual([
        '/films/.valence/0b5c.mp4',
        '/films/arrival/arrival - 1080p H264.valence.mp4',
      ]);
    },
    STARTING_POSTGRES_MS,
  );
});
