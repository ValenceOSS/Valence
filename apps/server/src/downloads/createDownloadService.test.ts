import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { describe, expect, it, vi } from 'vitest';
import { authSchema, valenceSchema } from '@ValenceServer/db/Schema';
import { keepingProfile } from './keepingProfile';
import { createDownloadService } from './createDownloadService';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { DownloadFile, Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const FILM: MediaItem = {
  id: MEDIA_ID,
  title: 'Arrival',
  year: 2016,
  container: 'mp4',
  durationSeconds: 7200,
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  bitrateKbps: 8000,
  audioStreams: [
    { index: 1, codec: 'aac', channels: 2, language: 'eng', isDefault: true, isAtmos: false },
  ],
  subtitleStreams: [],
};

const CAPABILITIES = {
  ffmpegVersion: 'ffmpeg 9.0',
  probeVersion: 1,
  ffmpegSupported: true,
  encoders: [{ codec: 'h264', encoder: 'libx264', accel: 'none', verified: true }],
  hardwareAccels: [],
  toneMapping: 'zscale' as const,
  canBurnTextSubtitles: true,
  canBurnImageSubtitles: true,
  concurrentRenders: 0,
  chains: [],
  hardwareScalers: [],
  hardwareOverlays: [],
  hardwareToneMaps: [],
  rejected: [],
};

const preparing = (progress: number): DownloadFile => ({
  id: 'a-rendition',
  isReady: false,
  progress,
  bytesPerSecond: 1000,
  file: 'download.mp4',
  sizeBytes: null,
});

const READY: DownloadFile = {
  id: 'a-rendition',
  isReady: true,
  progress: 100,
  bytesPerSecond: null,
  file: 'download.mp4',
  sizeBytes: 5_000_000_000,
};

/**
 * A Postgres of its own, in memory, holding the download tables exactly as their migrations make
 * them, beside the profile and item they belong to.
 *
 * @returns The database.
 */
const aScratchDatabase = async () => {
  const client = new PGlite();
  const migrations = await Promise.all(
    ['0045_offline_downloads.sql', '0046_download_speed.sql', '0083_the_device_that_asked.sql'].map(
      (name) => readFile(join(import.meta.dirname, '..', '..', 'drizzle', name), 'utf8'),
    ),
  );

  await client.exec(
    `CREATE TABLE "viewer_profile" ("id" text PRIMARY KEY, "userId" text NOT NULL);
     CREATE TABLE "media_item" ("id" text PRIMARY KEY);
     INSERT INTO "viewer_profile" VALUES ('a-profile', 'an-account');
     INSERT INTO "media_item" VALUES ('${MEDIA_ID}');`,
  );

  for (const migration of migrations) {
    await client.exec(migration.replaceAll('--> statement-breakpoint', ''));
  }

  return drizzle(client, { schema: { ...authSchema, ...valenceSchema } });
};

/**
 * The download service over a scratch database, a library holding one film, and a media service
 * whose answers each test chooses.
 *
 * @param answers - What the media service says to each request, in order.
 * @returns The service and the media service's fake.
 */
const build = async (answers: DownloadFile[]) => {
  const requestDownload = vi.fn<Transcoder['requestDownload']>();

  for (const answer of answers) {
    requestDownload.mockResolvedValueOnce(answer);
  }

  const transcoder = {
    requestDownload,
    readDownloadFile: vi.fn<Transcoder['readDownloadFile']>(() => Promise.resolve(null)),
    forgetDownload: vi.fn<Transcoder['forgetDownload']>(() => Promise.resolve(true)),
    stopDownload: vi.fn<Transcoder['stopDownload']>(() => Promise.resolve(true)),
  };
  const service = createDownloadService({
    db: await aScratchDatabase(),
    transcoder,
    capabilities: () => Promise.resolve(CAPABILITIES),
    media: {
      findForPlayback: (mediaId) =>
        Promise.resolve(
          mediaId === MEDIA_ID
            ? { item: FILM, path: '/films/Arrival.mp4', sizeBytes: 7_000_000_000, generation: 1 }
            : null,
        ),
      titleOf: (mediaId) => Promise.resolve(mediaId === MEDIA_ID ? 'Arrival' : null),
      episodesOf: () => Promise.resolve([]),
      seriesOf: () => Promise.resolve(null),
      keepingProfile,
    },
  });

  return { service, transcoder };
};

describe('createDownloadService', () => {
  it('remembers which device asked', async () => {
    const { service } = await build([preparing(0)]);

    const asked = await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);

    expect(asked).toMatchObject({ state: 'preparing', askedFrom: 'a-laptop' });
  });

  it('follows a file as it is prepared, and says when it is ready and whose it is', async () => {
    const { service } = await build([preparing(0), preparing(40), READY]);

    await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);

    const partWay = await service.follow();

    expect(partWay).toHaveLength(1);
    expect(partWay[0]).toMatchObject({
      profileId: 'a-profile',
      accountId: 'an-account',
      isNowReady: false,
      download: { state: 'preparing', progress: 0.4 },
    });

    const done = await service.follow();

    expect(done[0]).toMatchObject({
      isNowReady: true,
      download: { state: 'ready', sizeBytes: 5_000_000_000, askedFrom: 'a-laptop' },
    });
    expect((await service.list('a-profile'))[0]?.state).toBe('ready');
  });

  it('says nothing about a file that has not moved since it was last asked about', async () => {
    const { service } = await build([preparing(10), preparing(10)]);

    await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);

    await expect(service.follow()).resolves.toEqual([]);
  });

  it('leaves nothing more to follow once everything is ready', async () => {
    const { service, transcoder } = await build([READY]);

    await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);
    transcoder.requestDownload.mockClear();

    await expect(service.follow()).resolves.toEqual([]);
    expect(transcoder.requestDownload).not.toHaveBeenCalled();
  });

  it('keeps preparing, rather than failing, when the media service is briefly away', async () => {
    const { service, transcoder } = await build([preparing(10)]);

    await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);
    transcoder.requestDownload.mockRejectedValueOnce(new Error('connection refused'));

    await expect(service.follow()).resolves.toEqual([]);
    expect((await service.list('a-profile'))[0]?.state).toBe('preparing');
  });

  it('clears out what was ready before the cutoff, and deletes the file nobody else points at', async () => {
    const { service, transcoder } = await build([READY]);

    await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);

    await expect(service.clearOutBefore(new Date(Date.now() + 60_000))).resolves.toBe(1);
    await expect(service.list('a-profile')).resolves.toEqual([]);
    expect(transcoder.forgetDownload).toHaveBeenCalledWith('a-rendition');
  });

  it('leaves what is still being prepared, and what was asked for since the cutoff', async () => {
    const { service, transcoder } = await build([preparing(10), READY]);

    await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);

    await expect(service.clearOutBefore(new Date(Date.now() + 60_000))).resolves.toBe(0);
    await expect(service.clearOutBefore(new Date(Date.now() - 60_000))).resolves.toBe(0);
    expect(transcoder.forgetDownload).not.toHaveBeenCalled();
  });

  it('lists without asking the media service anything', async () => {
    const { service, transcoder } = await build([preparing(10)]);

    await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);
    transcoder.requestDownload.mockClear();

    await service.list('a-profile');

    expect(transcoder.requestDownload).not.toHaveBeenCalled();
  });

  it('keeps who asked first when it is carried on from a pause', async () => {
    const { service } = await build([preparing(10), preparing(10)]);
    const asked = await service.ask('a-profile', 'a-laptop', MEDIA_ID, 'original', []);

    await service.pause('a-profile', asked?.id ?? '');
    await service.resume('a-profile', asked?.id ?? '');

    expect((await service.list('a-profile'))[0]).toMatchObject({
      state: 'preparing',
      askedFrom: 'a-laptop',
    });
  });
});
