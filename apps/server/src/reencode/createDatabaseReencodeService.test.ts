import type { Said } from '@ValenceI18n/SaidSchema';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { asc, eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nullsLast } from '@ValenceDatabase/nullsLast';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, mediaRendition, reencodeRequest } from '#dialect/Schema';
import { createDatabaseReencodeService } from './createDatabaseReencodeService';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import type { MediaProbe, Transcoder } from '@ValenceServer/transcoder/TranscoderClient';
import type { ReencodeSubject } from './createDatabaseReencodeService';

const STARTING_POSTGRES_MS = 60_000;

const FILM_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const LIBRARY_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const REPLACING: ReencodeSettings = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
};

const REMUX: MediaItem = {
  id: FILM_ID,
  title: 'The Film',
  container: 'mkv',
  durationSeconds: 8520,
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 66000,
  sizeBytes: 70_000_000_000,
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
  ],
  subtitleStreams: [],
};

const PROBE: MediaProbe = {
  container: 'mkv',
  durationSeconds: 8520,
  bitrateKbps: 66000,
  canCopySegments: true,
  video: {
    index: 0,
    codec: 'h264',
    codecTag: null,
    width: 3840,
    height: 2160,
    range: 'SDR',
    rangeBase: 'SDR',
    bitrateKbps: 60000,
    bitDepth: 8,
    level: 51,
    frameRate: 23.976,
    isInterlaced: false,
    refFrames: 4,
    pixelAspect: null,
    rotationDegrees: null,
  },
  audioStreams: [],
  subtitleStreams: [],
  chapters: [],
};

const TRANSCODER: Transcoder = {
  isReachable: () => Promise.resolve(true),
  measureCache: () => Promise.resolve(null),
  sweepPreviews: () => Promise.reject(new Error('not used')),
  forgetPreview: () => Promise.reject(new Error('not used')),
  requestDownload: () => Promise.reject(new Error('not used')),
  requestRendition: () => Promise.reject(new Error('not used')),
  stopRendition: () => Promise.resolve(false),
  forgetRendition: () => Promise.resolve(false),
  readDownloadFile: () => Promise.reject(new Error('not used')),
  stopDownload: () => Promise.reject(new Error('not used')),
  forgetDownload: () => Promise.reject(new Error('not used')),
  forgetTrickplay: () => Promise.reject(new Error('not used')),
  sweepTrickplay: () => Promise.reject(new Error('not used')),
  probe: () => Promise.resolve(PROBE),
  startSession: () => Promise.reject(new Error('not used')),
  readSessionFile: () => Promise.resolve(null),
  readFile: () => Promise.resolve(null),
  readAudioRendition: () => Promise.resolve(null),
  fingerprint: () => Promise.reject(new Error('not used')),
  requestTrickplay: () => Promise.reject(new Error('not used')),
  readTrickplayFile: () => Promise.resolve(null),
  stopSession: () => Promise.resolve(true),
  heartbeatSession: () => Promise.resolve(true),
  readSubtitle: () => Promise.reject(new Error('not used')),
  readFrame: () => Promise.reject(new Error('not used')),
  requestPreview: () => Promise.reject(new Error('not used')),
  readPreviewFile: () => Promise.resolve(null),
  readMonitor: () => Promise.resolve({}),
  openMonitorSocket: () => Promise.resolve(null),
  capabilities: () =>
    Promise.resolve({
      ffmpegVersion: 'test',
      probeVersion: 1,
      ffmpegSupported: true,
      encoders: [],
      hardwareAccels: [],
      hardwareScalers: [],
      hardwareOverlays: [],
      hardwareToneMaps: [],
      rejected: [],
      toneMapping: 'unavailable' as const,
      canBurnTextSubtitles: true,
      canBurnImageSubtitles: true,
      concurrentRenders: 0,
      chains: [],
    }),
};

/**
 * A re-encode service over a fresh database holding one library and one film in it, whose file is
 * found by the given means.
 *
 * @param findForReencode - What the rest of the server says about the film.
 * @param awaitingReviewCap - How many encodes may wait to be judged at once.
 * @param overrides - A media service that does more, who is watching, and how to wait.
 * @returns The service, the database under it, and what it complained about.
 */
const aReencoder = async (
  findForReencode: (libraryPath: string) => ReencodeSubject | null,
  awaitingReviewCap = 10,
  overrides: {
    transcoder?: Transcoder;
    isBeingWatched?: () => boolean;
    wait?: () => Promise<void>;
  } = {},
) => {
  const db = await aMigratedDatabase();
  const libraryPath = await mkdtemp(join(tmpdir(), 'valence-reencode-'));
  const onProblem = vi.fn<(what: string, reason: Said) => void>();

  await writeFile(join(libraryPath, 'film.mkv'), 'a film');
  await db.insert(library).values({
    id: LIBRARY_ID,
    name: 'Films',
    kind: 'movies',
    path: libraryPath,
  });
  await db.insert(mediaItem).values({
    id: FILM_ID,
    libraryId: LIBRARY_ID,
    path: join(libraryPath, 'film.mkv'),
    title: 'The Film',
    sizeBytes: 1,
    modifiedAtMs: 1,
    container: 'mkv',
    durationSeconds: 60,
    videoCodec: 'h264',
    videoRange: 'sdr',
    width: 1920,
    height: 1080,
    audioStreams: [],
    subtitleStreams: [],
  });

  const transcoder = overrides.transcoder ?? TRANSCODER;
  const service = createDatabaseReencodeService({
    db,
    media: { findForReencode: () => Promise.resolve(findForReencode(libraryPath)) },
    transcoder,
    capabilities: transcoder.capabilities,
    forcedAccel: () => Promise.resolve('none'),
    isBeingWatched: overrides.isBeingWatched ?? (() => false),
    awaitingReviewCap: () => Promise.resolve(awaitingReviewCap),
    afterChange: () => Promise.resolve(),
    onProblem,
    ...(overrides.wait === undefined ? {} : { wait: overrides.wait }),
  });

  return { db, service, onProblem, libraryPath };
};

const KEEPING_BESIDE: ReencodeSettings = {
  mode: 'keep',
  quality: '1080p',
  videoCodec: 'h264',
  audio: 'keep',
  container: 'mp4',
  maxBitrateKbps: 3000,
  placement: 'beside',
};

/**
 * The film as the rest of the server describes it, in whichever library it was put in.
 *
 * @param libraryPath - The library's folder.
 * @returns The film.
 */
const theFilm = (libraryPath: string): ReencodeSubject => ({
  item: REMUX,
  title: 'The Film',
  seriesTitle: null,
  path: join(libraryPath, 'film.mkv'),
  libraryId: LIBRARY_ID,
  libraryPath,
});

/**
 * A media service that writes every rendition it is asked for at once, noting where.
 *
 * @param written - Where each was asked to go, in order.
 * @param isReadyAt - Whether an ask is answered as finished, by how many asks came before.
 * @returns The media service.
 */
const aWorkingTranscoder = (
  written: string[],
  isReadyAt: (asked: number) => boolean = () => true,
): Transcoder => ({
  ...TRANSCODER,
  capabilities: async () => ({
    ...(await TRANSCODER.capabilities()),
    encoders: [
      { codec: 'h264', encoder: 'libx264', accel: 'none', verified: true },
      { codec: 'hevc', encoder: 'libx265', accel: 'none', verified: true },
      { codec: 'eac3', encoder: 'eac3', accel: 'none', verified: true },
    ],
  }),
  probe: () =>
    Promise.resolve({
      ...PROBE,
      container: 'mov,mp4,m4a,3gp,3g2,mj2',
      video: PROBE.video === null ? null : { ...PROBE.video, width: 1920, height: 1080 },
      audioStreams: [
        {
          index: 1,
          codec: 'eac3',
          channels: 6,
          sampleRate: 48000,
          profile: null,
          language: 'eng',
          title: null,
          isDefault: true,
          isAtmos: false,
        },
      ],
    }),
  requestRendition: async (request) => {
    written.push(request.outputPath);

    const isReady = isReadyAt(written.length - 1);

    if (isReady) {
      await writeFile(request.outputPath, 'a copy');
    }

    return { id: request.outputPath, isReady, progress: isReady ? 100 : 10 };
  },
});

/**
 * A request as it would be stored, in whatever state and asked for at whatever time.
 *
 * @param id - The request.
 * @param state - Where it is up to.
 * @param askedAt - When it was asked for.
 * @returns The row.
 */
const aRequest = (id: string, state: string, askedAt: Date) => ({
  id,
  mediaItemId: FILM_ID,
  libraryId: LIBRARY_ID,
  mode: 'replace',
  state,
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
  originalPath: `/films/${id}.mkv`,
  originalSizeBytes: 1,
  originalProbe: {},
  workingPath: `/films/${id}.working.mkv`,
  askedAt,
});

/**
 * Moves the clock on a second each time the service says it has taken a request up, so requests it
 * takes up in turn are never started within the same millisecond and their order can be read back.
 *
 * @returns A progress listener to hand the service.
 */
const aTickingProgress = () =>
  vi.fn<(processed: number, total: number) => void>(() => {
    vi.setSystemTime(Date.now() + 1000);
  });

describe('createDatabaseReencodeService', { timeout: STARTING_POSTGRES_MS }, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hands back each request it queues, as it was stored', async () => {
    const { service } = await aReencoder((libraryPath) => ({
      item: REMUX,
      title: 'The Film',
      seriesTitle: null,
      path: join(libraryPath, 'film.mkv'),
      libraryId: LIBRARY_ID,
      libraryPath,
    }));

    const { started, refused } = await service.start([FILM_ID], REPLACING, null);

    expect(refused).toEqual([]);
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ mediaId: FILM_ID, state: 'queued', mode: 'replace' });
    await expect(service.list()).resolves.toMatchObject([{ id: started[0]?.id }]);
  });

  it('takes back what a stopped server left half done, then works through the queue oldest first', async () => {
    const { db, service, onProblem } = await aReencoder(() => null);

    await db
      .insert(reencodeRequest)
      .values([
        aRequest('stranded', 'encoding', new Date(1000)),
        aRequest('older', 'queued', new Date(2000)),
        aRequest('newer', 'queued', new Date(3000)),
        aRequest('judged', 'finished', new Date(500)),
      ]);

    const onProgress = aTickingProgress();

    vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
    await service.work(onProgress, () => false);

    expect(onProblem).toHaveBeenCalledWith(
      'reencode',
      'took /films/stranded.mkv back up, since this server stopped while it was being worked on',
    );
    expect(onProgress.mock.calls).toEqual([
      [0, 3],
      [1, 3],
      [2, 3],
    ]);

    const rows = await db
      .select({ id: reencodeRequest.id, state: reencodeRequest.state })
      .from(reencodeRequest)
      .orderBy(nullsLast(reencodeRequest.startedAt, 'asc'), asc(reencodeRequest.id));

    expect(rows).toEqual([
      { id: 'stranded', state: 'failed' },
      { id: 'older', state: 'failed' },
      { id: 'newer', state: 'failed' },
      { id: 'judged', state: 'finished' },
    ]);
  });

  it('takes nothing on while as many as may wait to be judged already are', async () => {
    const { db, service } = await aReencoder(() => null, 1);

    await db
      .insert(reencodeRequest)
      .values([
        aRequest('waiting', 'queued', new Date(2000)),
        aRequest('judging', 'awaitingReview', new Date(1000)),
      ]);

    await service.work(
      () => undefined,
      () => false,
    );

    const rows = await db
      .select({ id: reencodeRequest.id, state: reencodeRequest.state })
      .from(reencodeRequest)
      .orderBy(asc(reencodeRequest.id));

    expect(rows).toEqual([
      { id: 'judging', state: 'awaitingReview' },
      { id: 'waiting', state: 'queued' },
    ]);
  });

  it('keeps a copy beside the film under its readable name, and remembers it as a rendition', async () => {
    const written: string[] = [];
    const { db, service, libraryPath } = await aReencoder(theFilm, 10, {
      transcoder: aWorkingTranscoder(written),
    });

    const { started } = await service.start([FILM_ID], KEEPING_BESIDE, null);

    await service.work(
      () => undefined,
      () => false,
    );

    const expected = join(libraryPath, 'film - 1080p H264 3000kbps.valence.mp4');
    const [request] = await db.select().from(reencodeRequest);
    const kept = await service.renditionsFor(FILM_ID);

    expect(started[0]).toMatchObject({
      container: 'mp4',
      maxBitrateKbps: 3000,
      placement: 'beside',
    });
    expect(written).toEqual([expected]);
    expect(request).toMatchObject({ state: 'finished', workingPath: expected, origin: 'admin' });
    expect(kept).toMatchObject([
      { id: request?.renditionId, fileName: 'film - 1080p H264 3000kbps.valence.mp4' },
    ]);
  });

  it('refuses a copy just like one already kept, and a name a file Valence did not make has taken', async () => {
    const written: string[] = [];
    const { db, service, libraryPath } = await aReencoder(theFilm, 10, {
      transcoder: aWorkingTranscoder(written),
    });

    await writeFile(join(libraryPath, 'film - 1080p H264.valence.mp4'), 'somebody else');

    const taken = await service.estimate([FILM_ID], {
      ...KEEPING_BESIDE,
      maxBitrateKbps: undefined,
    });

    expect(taken.candidates[0]?.refusal?.code).toBe('NameIsTaken');

    await service.start([FILM_ID], KEEPING_BESIDE, null);
    await service.work(
      () => undefined,
      () => false,
    );

    const again = await service.estimate([FILM_ID], KEEPING_BESIDE);

    expect(again.candidates[0]?.refusal?.code).toBe('AlreadyKept');
    await expect(db.select().from(mediaRendition)).resolves.toHaveLength(1);
  });

  it('works through what an administrator asked for before what pre-transcoding queued', async () => {
    const written: string[] = [];
    const { db, service } = await aReencoder(theFilm, 10, {
      transcoder: aWorkingTranscoder(written),
    });

    await service.start(
      [FILM_ID],
      { ...KEEPING_BESIDE, placement: 'hidden' },
      null,
      'preTranscode',
    );
    await db.update(reencodeRequest).set({ askedAt: new Date(1000) });
    await db
      .insert(reencodeRequest)
      .values({ ...aRequest('asked', 'queued', new Date(5000)), mediaItemId: FILM_ID });

    vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
    await service.work(aTickingProgress(), () => false);

    const rows = await db
      .select({ id: reencodeRequest.id, origin: reencodeRequest.origin })
      .from(reencodeRequest)
      .orderBy(asc(reencodeRequest.startedAt));

    expect(rows.map((row) => row.origin)).toEqual(['admin', 'preTranscode']);
  });

  it('puts a pre-transcode back rather than failing it while somebody watches the film', async () => {
    const written: string[] = [];
    let isWatched = false;
    const { db, service } = await aReencoder(theFilm, 10, {
      transcoder: aWorkingTranscoder(written),
      isBeingWatched: () => isWatched,
    });

    await service.start([FILM_ID], KEEPING_BESIDE, null, 'preTranscode');
    isWatched = true;

    await service.work(
      () => undefined,
      () => false,
    );

    await expect(
      db
        .select({ state: reencodeRequest.state, origin: reencodeRequest.origin })
        .from(reencodeRequest),
    ).resolves.toEqual([{ state: 'queued', origin: 'preTranscode' }]);
    expect(written).toEqual([]);
  });

  it('stops an encode that was cancelled while it ran, and leaves it cancelled', async () => {
    const written: string[] = [];
    const stopped: string[] = [];
    const transcoder: Transcoder = {
      ...aWorkingTranscoder(written, () => false),
      stopRendition: (outputPath) => {
        stopped.push(outputPath);

        return Promise.resolve(true);
      },
    };
    let cancelling: (() => Promise<void>) | null = null;
    const { db, service, libraryPath } = await aReencoder(theFilm, 10, {
      transcoder,
      wait: () => cancelling?.() ?? Promise.resolve(),
    });

    const { started } = await service.start([FILM_ID], KEEPING_BESIDE, null);
    const id = started[0]?.id ?? '';

    cancelling = async () => {
      await service.cancel(id);
    };

    await service.work(
      () => undefined,
      () => false,
    );

    await expect(
      db
        .select({ state: reencodeRequest.state })
        .from(reencodeRequest)
        .where(eq(reencodeRequest.id, id)),
    ).resolves.toEqual([{ state: 'cancelled' }]);
    expect(stopped).toContain(join(libraryPath, 'film - 1080p H264 3000kbps.valence.mp4'));
    expect((await readdir(libraryPath)).filter((name) => name.includes('.valence.'))).toEqual([]);
  });
});
