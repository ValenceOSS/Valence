import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  library,
  mediaItem,
  mediaRendition,
  preTranscodeRefusal,
  reencodeRequest,
} from '#dialect/Schema';
import { saying } from '@ValenceI18n/saying';
import { PRE_TRANSCODING_DEFAULTS } from '@ValenceContracts/schemas/PreTranscoding';
import { createPreTranscodingService } from './createPreTranscodingService';
import type { PreTranscodingSettings } from '@ValenceContracts/schemas/PreTranscoding';
import type { Reencode, ReencodeOrigin, ReencodeRefusal } from '@ValenceContracts/schemas/Reencode';
import type { ReencodeService } from '@ValenceServer/reencode/ReencodeService';

const STARTING_POSTGRES_MS = 60_000;

const FILMS_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const SHOWS_ID = '0b6f3a52-2a0c-4f7e-9d7b-1f3a7c2b8e11';

const MUSIC_ID = '5d0e1c7a-6a39-4f0e-9f6b-1d2c3b4a5e6f';

const ON: PreTranscodingSettings = { ...PRE_TRANSCODING_DEFAULTS, isEnabled: true };

const AT_THREE_IN_THE_MORNING = new Date('2026-01-10T03:00:00Z');

const AT_NOON = new Date('2026-01-10T12:00:00Z');

/**
 * A file as the scan would store it.
 *
 * @param id - The file, whose identifier also orders it.
 * @param libraryId - The library it is in.
 * @param picture - Its picture, a 4K HEVC remux unless said otherwise.
 * @returns The row.
 */
const aFile = (
  id: string,
  libraryId: string,
  picture: Partial<typeof mediaItem.$inferInsert> = {},
): typeof mediaItem.$inferInsert => ({
  id,
  libraryId,
  path: `/media/${id}/${id}.mkv`,
  title: id,
  sizeBytes: 1,
  modifiedAtMs: 1,
  container: 'mkv',
  durationSeconds: 60,
  bitrateKbps: 40000,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  width: 3840,
  height: 2160,
  audioStreams: [],
  subtitleStreams: [],
  ...picture,
});

/**
 * A request as the re-encoder stores one.
 *
 * @param mediaItemId - The file.
 * @param state - Where it has got to.
 * @param extra - Anything else about it.
 * @returns The row.
 */
const aRequest = (
  mediaItemId: string,
  state: string,
  extra: Partial<typeof reencodeRequest.$inferInsert> = {},
): typeof reencodeRequest.$inferInsert => ({
  id: randomUUID(),
  mediaItemId,
  libraryId: FILMS_ID,
  mode: 'keep',
  state,
  quality: '1080p',
  videoCodec: 'h264',
  container: 'mp4',
  audio: 'keep',
  originalPath: `/media/${mediaItemId}/${mediaItemId}.mkv`,
  originalSizeBytes: 1,
  originalProbe: {},
  workingPath: `/media/${mediaItemId}/${mediaItemId} - 1080p H264.valence.mp4`,
  placement: 'beside',
  origin: 'preTranscode',
  ...extra,
});

/**
 * A re-encode as the re-encoder hands one back, for a request it took on.
 *
 * @param mediaId - The file.
 * @param origin - Who asked.
 * @returns The re-encode.
 */
const aReencode = (mediaId: string, origin: ReencodeOrigin): Reencode => ({
  id: randomUUID(),
  mediaId,
  libraryId: FILMS_ID,
  title: mediaId,
  seriesTitle: null,
  mode: 'keep',
  quality: '1080p',
  videoCodec: 'h264',
  audio: 'keep',
  state: 'queued',
  origin,
  durationSeconds: 60,
  originalSizeBytes: 1,
  estimatedBytes: null,
  producedBytes: null,
  progress: 0,
  bytesPerSecond: null,
  failure: null,
  hasSample: false,
  askedAt: AT_NOON.toISOString(),
  startedAt: null,
  encodedAt: null,
  reviewedAt: null,
});

/**
 * Pre-transcoding over a fresh database holding a library of films, one of shows and one of
 * music, with a re-encoder that queues what it is asked to unless told to refuse it.
 *
 * @param files - What the libraries hold.
 * @param options - The settings, the time, and what the re-encoder refuses.
 * @returns The service, the database, and what the re-encoder was asked.
 */
const aPreTranscoder = async (
  files: (typeof mediaItem.$inferInsert)[],
  options: {
    settings?: PreTranscodingSettings;
    at?: Date;
    refuses?: Record<string, ReencodeRefusal>;
  } = {},
) => {
  const db = await aMigratedDatabase();
  let held = options.settings ?? ON;
  const asked: { mediaId: string; askedBy: string | null }[] = [];
  const cancelled: string[] = [];
  let queuedCount = 0;

  await db.insert(library).values([
    { id: FILMS_ID, name: 'Films', kind: 'movies', path: '/media/films' },
    { id: SHOWS_ID, name: 'Shows', kind: 'shows', path: '/media/shows' },
    { id: MUSIC_ID, name: 'Music', kind: 'music', path: '/media/music' },
  ]);

  if (files.length > 0) {
    await db.insert(mediaItem).values(files);
  }

  const reencodes: ReencodeService = {
    estimate: () => Promise.reject(new Error('not used')),
    start: async (mediaIds, _settings, askedBy, origin = 'admin') => {
      const mediaId = mediaIds[0] ?? '';
      const refusal = options.refuses?.[mediaId];

      asked.push({ mediaId, askedBy });

      if (refusal !== undefined) {
        return { started: [], refused: [{ mediaId, refusal }] };
      }

      await db.insert(reencodeRequest).values(aRequest(mediaId, 'queued', { askedBy, origin }));

      return { started: [aReencode(mediaId, origin)], refused: [] };
    },
    list: () => Promise.resolve([]),
    cancel: (id) => {
      cancelled.push(id);

      return Promise.resolve(true);
    },
    confirm: () => Promise.resolve(false),
    reject: () => Promise.resolve(false),
    sample: () => Promise.resolve(false),
    frame: () => Promise.resolve(null),
    renditionsFor: () => Promise.resolve([]),
    removeRendition: () => Promise.resolve(false),
    work: () => Promise.resolve(0),
  };

  const service = createPreTranscodingService({
    db,
    reencodes,
    settings: {
      read: () => Promise.resolve(held),
      write: (next) => {
        held = next;

        return Promise.resolve();
      },
    },
    timezone: () => Promise.resolve('UTC'),
    onQueued: () => {
      queuedCount += 1;
    },
    now: () => options.at ?? AT_THREE_IN_THE_MORNING,
  });

  return { db, service, asked, cancelled, queued: () => queuedCount };
};

describe('createPreTranscodingService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('does nothing while it is off, or paused', async () => {
    const off = await aPreTranscoder([aFile('a', FILMS_ID)], {
      settings: PRE_TRANSCODING_DEFAULTS,
    });
    const paused = await aPreTranscoder([aFile('a', FILMS_ID)], {
      settings: { ...ON, isPaused: true },
    });

    await expect(off.service.tick()).resolves.toEqual({ kind: 'off' });
    await expect(paused.service.tick()).resolves.toEqual({ kind: 'paused' });
    expect([...off.asked, ...paused.asked]).toEqual([]);
  });

  it('queues the first film the copy would improve, and leaves alone what it would not', async () => {
    const { service, asked, queued } = await aPreTranscoder([
      aFile('a-small', FILMS_ID, {
        width: 1280,
        height: 720,
        bitrateKbps: 2000,
        videoCodec: 'h264',
      }),
      aFile('b-trailer', FILMS_ID, { extraKind: 'trailer' }),
      aFile('c-song', MUSIC_ID),
      aFile('d-remux', FILMS_ID),
      aFile('e-episode', SHOWS_ID),
    ]);

    await expect(service.tick()).resolves.toEqual({ kind: 'queued', mediaId: 'd-remux' });
    expect(asked).toEqual([{ mediaId: 'd-remux', askedBy: null }]);
    expect(queued()).toBe(1);
  });

  it('waits while one of its own is under way, rather than queueing a second', async () => {
    const { db, service, asked, queued } = await aPreTranscoder([
      aFile('a', FILMS_ID),
      aFile('b', FILMS_ID),
    ]);

    await db.insert(reencodeRequest).values(aRequest('a', 'encoding'));

    await expect(service.tick()).resolves.toEqual({ kind: 'underWay' });
    expect(asked).toEqual([]);
    expect(queued()).toBe(1);
  });

  it('works only in the chosen libraries', async () => {
    const { service } = await aPreTranscoder(
      [aFile('a-film', FILMS_ID), aFile('b-episode', SHOWS_ID)],
      { settings: { ...ON, libraryIds: [SHOWS_ID] } },
    );

    await expect(service.tick()).resolves.toEqual({ kind: 'queued', mediaId: 'b-episode' });
  });

  it('stops what it queued once the window closes, but not a copy somebody asked for now', async () => {
    const { db, service, cancelled, asked } = await aPreTranscoder([aFile('a', FILMS_ID)], {
      at: AT_NOON,
    });
    const scheduled = aRequest('a', 'encoding');
    const askedFor = aRequest('a', 'queued', { askedBy: 'ada' });
    const anAdministrators = aRequest('a', 'queued', { origin: 'admin' });

    await db.insert(reencodeRequest).values([scheduled, askedFor, anAdministrators]);

    await expect(service.tick()).resolves.toEqual({ kind: 'outsideTheWindow', cancelled: 1 });
    expect(cancelled).toEqual([scheduled.id]);
    expect(asked).toEqual([]);
  });

  it('runs at any hour where it is to carry on until everything is done', async () => {
    const { service } = await aPreTranscoder([aFile('a', FILMS_ID)], {
      at: AT_NOON,
      settings: { ...ON, schedule: 'untilDone' },
    });

    await expect(service.tick()).resolves.toEqual({ kind: 'queued', mediaId: 'a' });
  });

  it('keeps a window that runs past midnight', async () => {
    const { service } = await aPreTranscoder([aFile('a', FILMS_ID)], {
      at: new Date('2026-01-10T23:30:00Z'),
      settings: { ...ON, windowStartHour: 22, windowEndHour: 4 },
    });

    await expect(service.tick()).resolves.toEqual({ kind: 'queued', mediaId: 'a' });
  });

  it('passes over a film already kept in the target, one refused, and one that failed twice', async () => {
    const { db, service } = await aPreTranscoder([
      aFile('a-kept', FILMS_ID),
      aFile('b-refused', FILMS_ID),
      aFile('c-failed', FILMS_ID),
      aFile('d-next', FILMS_ID),
    ]);
    const kept = aRequest('a-kept', 'finished');

    await db
      .insert(reencodeRequest)
      .values([kept, aRequest('c-failed', 'failed'), aRequest('c-failed', 'failed')]);
    await db.insert(mediaRendition).values({
      id: randomUUID(),
      mediaItemId: 'a-kept',
      path: kept.workingPath,
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
    await db.insert(preTranscodeRefusal).values({
      mediaItemId: 'b-refused',
      target: '1080p/h264/mp4/any/keep',
      code: 'FolderIsReadOnly',
      detail: saying('server.reencode.refuseReencode.valenceCannotWriteToTheFolder'),
    });

    await expect(service.tick()).resolves.toEqual({ kind: 'queued', mediaId: 'd-next' });

    const status = await service.status();

    expect(status).toMatchObject({ copiesMade: 1, stillNeeded: 0, givenUp: 2, isInWindow: true });
  });

  it('remembers a refusal and moves on, but tries again later what was only being watched', async () => {
    const { db, service, asked } = await aPreTranscoder(
      [aFile('a-readonly', FILMS_ID), aFile('b-watched', FILMS_ID), aFile('c-fine', FILMS_ID)],
      {
        refuses: {
          'a-readonly': {
            code: 'FolderIsReadOnly',
            detail: saying('server.reencode.refuseReencode.valenceCannotWriteToTheFolder'),
          },
          'b-watched': {
            code: 'BeingWatched',
            detail: saying('server.reencode.refuseReencode.somebodyIsWatchingThisNowReplacing'),
          },
        },
      },
    );

    await expect(service.tick()).resolves.toEqual({ kind: 'queued', mediaId: 'c-fine' });
    expect(asked.map((one) => one.mediaId)).toEqual(['a-readonly', 'b-watched', 'c-fine']);
    await expect(
      db.select({ mediaItemId: preTranscodeRefusal.mediaItemId }).from(preTranscodeRefusal),
    ).resolves.toEqual([{ mediaItemId: 'a-readonly' }]);
  });

  it('says it is finished once nothing is left to improve', async () => {
    const { service } = await aPreTranscoder([
      aFile('a', FILMS_ID, { width: 1920, height: 1080, bitrateKbps: 3000, videoCodec: 'h264' }),
    ]);

    await expect(service.tick()).resolves.toEqual({ kind: 'nothingLeft' });
  });

  it('makes the next copy when asked to now, whatever the hour, and says who asked', async () => {
    const { service, asked } = await aPreTranscoder([aFile('a', FILMS_ID)], { at: AT_NOON });

    await expect(service.runNow('ada')).resolves.toBe(true);
    expect(asked).toEqual([{ mediaId: 'a', askedBy: 'ada' }]);
  });

  it('makes nothing when asked to now while it is off', async () => {
    const { service, asked } = await aPreTranscoder([aFile('a', FILMS_ID)], {
      settings: PRE_TRANSCODING_DEFAULTS,
    });

    await expect(service.runNow('ada')).resolves.toBe(false);
    expect(asked).toEqual([]);
  });

  it('stops its own work and forgets every refusal when it is paused', async () => {
    const { db, service, cancelled } = await aPreTranscoder([aFile('a', FILMS_ID)]);
    const running = aRequest('a', 'encoding');

    await db.insert(reencodeRequest).values(running);
    await db.insert(preTranscodeRefusal).values({
      mediaItemId: 'a',
      target: '1080p/h264/mp4/any/keep',
      code: 'FolderIsReadOnly',
      detail: saying('server.reencode.refuseReencode.valenceCannotWriteToTheFolder'),
    });

    const saved = await service.save({ ...ON, isPaused: true });

    expect(saved.settings.isPaused).toBe(true);
    expect(cancelled).toEqual([running.id]);
    await expect(db.select().from(preTranscodeRefusal)).resolves.toEqual([]);
  });

  it('leaves its work running when what is saved changes nothing about the copy', async () => {
    const { db, service, cancelled } = await aPreTranscoder([aFile('a', FILMS_ID)]);

    await db.insert(reencodeRequest).values(aRequest('a', 'encoding'));
    await service.save({ ...ON, windowEndHour: 7 });

    expect(cancelled).toEqual([]);
  });
});
