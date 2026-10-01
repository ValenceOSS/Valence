import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library } from '#dialect/Schema';
import { createDatabaseUploadSessions } from './createDatabaseUploadSessions';

const STARTING_THE_DATABASE_MS = 60_000;

const UPLOAD = {
  libraryId: 'films',
  path: 'Arrival.mkv',
  destination: '/media/films/Arrival.mkv',
  bytes: 5 * 1024 ** 3,
};

/**
 * A migrated database holding the library an upload lands in, so what is tested is the migrations
 * and the queries together.
 *
 * @returns The database.
 */
const aScratchDatabase = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });

  return db;
};

describe('createDatabaseUploadSessions', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('keeps an upload, file sizes past four gigabytes and all, and finds it again', async () => {
    const sessions = createDatabaseUploadSessions(await aScratchDatabase(), 60_000, 1024 ** 3);
    const opened = await sessions.open(UPLOAD);

    expect(opened.pieces).toBe(5);

    const found = await sessions.find(opened.uploadId, 'films');

    expect(found).toMatchObject({ bytes: UPLOAD.bytes, pieces: 5, received: [] });
    await expect(sessions.find(opened.uploadId, 'shows')).resolves.toBeNull();
  });

  it('records each piece once, in order, and takes one back that arrived short', async () => {
    const sessions = createDatabaseUploadSessions(await aScratchDatabase(), 60_000, 1024 ** 3);
    const { uploadId } = await sessions.open(UPLOAD);

    await sessions.receive(uploadId, 3, true);
    await sessions.receive(uploadId, 0, true);
    await expect(sessions.receive(uploadId, 3, true)).resolves.toEqual([0, 3]);
    await expect(sessions.receive(uploadId, 0, false)).resolves.toEqual([3]);
    expect((await sessions.find(uploadId, 'films'))?.received).toEqual([3]);
  });

  it('loses no piece when several land at once', async () => {
    const sessions = createDatabaseUploadSessions(await aScratchDatabase(), 60_000, 1024 ** 3);
    const { uploadId } = await sessions.open(UPLOAD);

    await Promise.all([0, 1, 2, 3, 4].map((index) => sessions.receive(uploadId, index, true)));

    expect((await sessions.find(uploadId, 'films'))?.received).toEqual([0, 1, 2, 3, 4]);
  });

  it('forgets an upload once closed, and gives up those left alone too long', async () => {
    const db = await aScratchDatabase();
    const sessions = createDatabaseUploadSessions(db, 60_000, 1024 ** 3);
    const closed = await sessions.open(UPLOAD);
    const kept = await sessions.open(UPLOAD);

    await sessions.close(closed.uploadId);

    await expect(sessions.find(closed.uploadId, 'films')).resolves.toBeNull();
    await expect(sessions.receive(closed.uploadId, 0, true)).resolves.toEqual([]);
    await expect(sessions.stale()).resolves.toEqual([]);

    const later = createDatabaseUploadSessions(db, -1, 1024 ** 3);

    expect((await later.stale()).map((one) => one.uploadId)).toEqual([kept.uploadId]);
    await expect(sessions.find(kept.uploadId, 'films')).resolves.toBeNull();
    await expect(later.stale()).resolves.toEqual([]);
  });

  it('counts an upload as touched each time it is found', async () => {
    const sessions = createDatabaseUploadSessions(await aScratchDatabase(), 60_000, 1024 ** 3);
    const opened = await sessions.open(UPLOAD);
    const found = await sessions.find(opened.uploadId, 'films');

    expect(found?.touchedAt).toBeGreaterThanOrEqual(opened.touchedAt);
  });
});
