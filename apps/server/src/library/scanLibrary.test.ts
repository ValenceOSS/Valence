import { describe, expect, it, vi } from 'vitest';
import { scanLibrary, selectChanged } from './scanLibrary';
import type { MediaRow, ScanPhase, ScannedFile, ScannedItem, StoredItem } from './scanLibrary';
import type { MetadataProvider } from './MetadataProvider';
import { resolveSeriesKey } from './resolveSeriesKey';
import type { MediaProbe, Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

const LIBRARY_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const departed = (path: string): ScannedItem => ({
  itemId: `gone-${path}`,
  title: path,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  year: null,
  posterUrl: null,
  overview: null,
  durationSeconds: null,
  genres: [],
  rating: null,
  quality: null,
});

const probe = (): MediaProbe => ({
  container: 'mkv',
  durationSeconds: 7200,
  bitrateKbps: 12000,
  video: {
    index: 0,
    codec: 'hevc',
    codecTag: null,
    width: 3840,
    height: 2160,
    range: 'HDR10',
    rangeBase: 'HDR10',
    bitrateKbps: 12000,
    bitDepth: 10,
    level: 150,
    frameRate: 23.976,
    isInterlaced: false,
    refFrames: 4,
    pixelAspect: null,
    rotationDegrees: null,
  },
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
      isAtmos: true,
    },
  ],
  subtitleStreams: [],
  chapters: [],
});

const file = (path: string, overrides: Partial<ScannedFile> = {}): ScannedFile => ({
  path,
  sizeBytes: 1000,
  modifiedAtMs: 1000,
  ...overrides,
});

const stored = (path: string, overrides: Partial<StoredItem> = {}): StoredItem => ({
  path,
  sizeBytes: 1000,
  modifiedAtMs: 1000,
  externalId: null,
  videoBitDepth: 8,
  videoRangeBase: 'HDR10',
  canCopySegments: true,
  probeVersion: 1,
  videoFrameRate: 23.976,
  ...overrides,
});

const harness = (options: {
  found?: ScannedFile[];
  unreadable?: string[];
  existing?: StoredItem[];
  probeImpl?: (path: string) => Promise<MediaProbe>;
  providers?: MetadataProvider[];
  force?: boolean;
  isPartial?: boolean;
  isCancelled?: () => boolean;
  onProblem?: (path: string, reason: string) => void;
  onProgress?: (phase: ScanPhase, processed: number, total: number) => void;
  trickplay?: { intervalSeconds: number; tileWidth: number; columns: number; rows: number };
  overrides?: { path: string; externalId: string; externalKind: 'tv' | 'movie' }[];
  defaultAudioLanguage?: string | null;
  atOnce?: number;
  capabilitiesImpl?: () => Promise<never>;
  onAdded?: (item: ScannedItem) => void;
  linkExtras?: (libraryId: string, links: { path: string; parentPath: string }[]) => Promise<void>;
  forgetStaleVersions?: (libraryId: string, stillVersions: string[]) => Promise<void>;
  root?: string;
  kind?: 'movies' | 'shows';
  within?: string;
  regroupSeries?: (libraryId: string, foldersByPath: Map<string, string>) => Promise<void>;
}) => {
  const rows: MediaRow[] = [];
  const walked: string[] = [];
  const removedPaths: string[] = [];
  const markScanned = vi.fn(() => Promise.resolve());
  const previewRequests: { inputPath: string; audioStreamIndex?: number }[] = [];

  const transcoder: Transcoder = {
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
    probe: options.probeImpl ?? (() => Promise.resolve(probe())),
    startSession: () =>
      Promise.resolve({ id: 'x', manifest: '/x', encodesVideo: false, reuse: 'none' as const }),
    readSessionFile: () => Promise.resolve(null),
    readFile: () => Promise.resolve(null),
    readAudioRendition: () => Promise.resolve(null),
    fingerprint: () => Promise.resolve({ framesPerSecond: 15.625, startSeconds: 0, hashes: [] }),
    requestTrickplay: () =>
      Promise.resolve({
        id: 'thumbs',
        intervalSeconds: 10,
        tileWidth: 320,
        tileHeight: 180,
        columns: 10,
        rows: 10,
        sheets: [],
        isReady: true,
        index: '/trickplay/thumbs/thumbnails.vtt',
      }),
    readTrickplayFile: () => Promise.resolve(null),
    stopSession: () => Promise.resolve(true),
    heartbeatSession: () => Promise.resolve(true),
    readSubtitle: () => Promise.resolve('WEBVTT\n'),
    readFrame: () => Promise.resolve(new ArrayBuffer(0)),
    requestPreview: (request) => {
      previewRequests.push(request);

      return Promise.resolve({ id: 'p', url: '/p', isReady: true });
    },
    readPreviewFile: () => Promise.resolve(null),
    readMonitor: () => Promise.resolve({}),
    openMonitorSocket: () => Promise.resolve(null),
    capabilities: () =>
      options.capabilitiesImpl === undefined
        ? Promise.resolve({
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
          })
        : options.capabilitiesImpl(),
  };

  const run = () =>
    scanLibrary({
      libraryId: LIBRARY_ID,
      kind: options.kind ?? 'movies',
      root: options.root ?? '/media/films',
      ...(options.within === undefined ? {} : { within: options.within }),
      files: {
        listFiles: (folder) => {
          walked.push(folder);

          return Promise.resolve({
            files: options.found ?? [],
            unreadable: options.unreadable ?? [],
          });
        },
      },
      store: {
        listStored: () => Promise.resolve(options.existing ?? []),
        upsert: (row) => {
          rows.push(row);

          return Promise.resolve(`item-${rows.length.toString()}`);
        },
        removeByPaths: (_, paths) => {
          removedPaths.push(...paths);

          return Promise.resolve(paths.map((path) => departed(path)));
        },
        listOverrides: () => Promise.resolve(options.overrides ?? []),
        ...(options.linkExtras === undefined ? {} : { linkExtras: options.linkExtras }),
        ...(options.regroupSeries === undefined ? {} : { regroupSeries: options.regroupSeries }),
        ...(options.forgetStaleVersions === undefined
          ? {}
          : { forgetStaleVersions: options.forgetStaleVersions }),
        markScanned,
      },
      transcoder,
      ...(options.defaultAudioLanguage === undefined
        ? {}
        : { defaultAudioLanguage: options.defaultAudioLanguage }),
      ...(options.providers === undefined ? {} : { providers: options.providers }),
      ...(options.force === undefined ? {} : { force: options.force }),
      ...(options.isPartial === undefined ? {} : { isPartial: options.isPartial }),
      ...(options.isCancelled === undefined ? {} : { isCancelled: options.isCancelled }),
      ...(options.onProblem === undefined ? {} : { onProblem: options.onProblem }),
      ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress }),
      ...(options.onAdded === undefined ? {} : { onAdded: options.onAdded }),
      ...(options.atOnce === undefined ? {} : { atOnce: options.atOnce }),
      ...(options.trickplay === undefined ? {} : { trickplay: options.trickplay }),
    });

  return { run, rows, removedPaths, markScanned, previewRequests, walked };
};

describe('a library whose files have gone from under it', () => {
  it('keeps what it held when the root turns up empty, since a share can be unmounted', async () => {
    const { run, removedPaths } = harness({
      found: [],
      existing: [stored('/a.mkv'), stored('/b.mkv')],
    });

    await run();

    expect(removedPaths).toEqual([]);
  });

  it('says why nothing was touched, rather than reporting a scan that did nothing', async () => {
    const problems: string[] = [];

    const { run } = harness({
      found: [],
      existing: [stored('/a.mkv')],
      onProblem: (_path, reason) => {
        problems.push(reason);
      },
    });

    await run();

    expect(problems.join(' ')).toContain('not mounted');
  });

  it('probes again where nobody recorded the colour depth', async () => {
    const { run, rows } = harness({
      found: [file('/a.mkv')],
      existing: [stored('/a.mkv', { videoBitDepth: null })],
    });

    await run();

    expect(rows.map((row) => row.path)).toEqual(['/a.mkv']);
  });

  it('probes again where nobody recorded what is legible underneath the range', async () => {
    const { run, rows } = harness({
      found: [file('/a.mkv')],
      existing: [stored('/a.mkv', { videoRangeBase: null })],
    });

    await run();

    expect(rows.map((row) => row.path)).toEqual(['/a.mkv']);
  });

  it('leaves a file alone once its colour depth is known', async () => {
    const { run, rows } = harness({
      found: [file('/a.mkv')],
      existing: [stored('/a.mkv')],
    });

    await run();

    expect(rows).toEqual([]);
  });

  it('still removes what has gone while other files remain, which is a real deletion', async () => {
    const { run, removedPaths } = harness({
      found: [file('/a.mkv')],
      existing: [stored('/a.mkv'), stored('/b.mkv')],
    });

    await run();

    expect(removedPaths).toEqual(['/b.mkv']);
  });

  it('leaves an empty library empty rather than complaining about it', async () => {
    const problems: string[] = [];

    const { run, removedPaths } = harness({
      found: [],
      existing: [],
      onProblem: (_path, reason) => {
        problems.push(reason);
      },
    });

    await run();

    expect(removedPaths).toEqual([]);
    expect(problems).toEqual([]);
  });
});

describe('a scan of a few named files, rather than the whole library', () => {
  it('walks only the folder it is given, but files every programme by the library root', async () => {
    const regroupSeries = vi.fn<(libraryId: string, folders: Map<string, string>) => Promise<void>>(
      () => Promise.resolve(),
    );
    const derek = '/media/shows/Derek/Season 1/Derek.S01E01.mkv';
    const theFall = '/media/shows/The Fall/Season 1/The.Fall.S01E01.mkv';
    const loose = '/media/shows/Loose.S01E01.mkv';
    const { run, walked } = harness({
      kind: 'shows',
      root: '/media/shows',
      within: '/media/shows/Derek',
      found: [file(derek)],
      existing: [stored(derek), stored(theFall), stored(loose)],
      force: true,
      isPartial: true,
      regroupSeries,
    });

    await run();

    const folders = regroupSeries.mock.calls[0]?.[1];

    expect(walked).toEqual(['/media/shows/Derek']);
    expect(folders).toEqual(new Map([[derek, '/media/shows/Derek']]));
  });

  it('files every programme again when it walked the whole library', async () => {
    const regroupSeries = vi.fn<(libraryId: string, folders: Map<string, string>) => Promise<void>>(
      () => Promise.resolve(),
    );
    const derek = '/media/shows/Derek/Season 1/Derek.S01E01.mkv';
    const theFall = '/media/shows/The Fall/Season 1/The.Fall.S01E01.mkv';
    const { run } = harness({
      kind: 'shows',
      root: '/media/shows',
      found: [file(derek), file(theFall)],
      existing: [stored(derek), stored(theFall)],
      regroupSeries,
    });

    await run();

    expect(regroupSeries.mock.calls[0]?.[1]).toEqual(
      new Map([
        [derek, '/media/shows/Derek'],
        [theFall, '/media/shows/The Fall'],
      ]),
    );
  });

  it('leaves alone everything it was not asked about', async () => {
    const { run, removedPaths } = harness({
      found: [file('/from-s01e01.mkv')],
      existing: [stored('/from-s01e01.mkv'), stored('/parasite.mkv'), stored('/heat.mkv')],
      force: true,
      isPartial: true,
    });

    await run();

    expect(removedPaths).toEqual([]);
  });

  it('still reads the files it was asked about', async () => {
    const { run, rows } = harness({
      found: [file('/from-s01e01.mkv')],
      existing: [stored('/from-s01e01.mkv'), stored('/parasite.mkv')],
      force: true,
      isPartial: true,
    });

    await run();

    expect(rows.map((row) => row.path)).toEqual(['/from-s01e01.mkv']);
  });

  it('deletes what has gone when the listing was the whole library', async () => {
    const { run, removedPaths } = harness({
      found: [file('/from-s01e01.mkv')],
      existing: [stored('/from-s01e01.mkv'), stored('/parasite.mkv')],
      force: true,
    });

    await run();

    expect(removedPaths).toEqual(['/parasite.mkv']);
  });
});

describe('selectChanged', () => {
  it('treats an unseen file as changed', () => {
    const { changed } = selectChanged([file('/a.mkv')], []);

    expect(changed).toHaveLength(1);
  });

  it('leaves an unchanged file alone', () => {
    const { changed } = selectChanged([file('/a.mkv')], [stored('/a.mkv')]);

    expect(changed).toHaveLength(0);
  });

  it('notices a file whose size changed', () => {
    const { changed } = selectChanged([file('/a.mkv', { sizeBytes: 2000 })], [stored('/a.mkv')]);

    expect(changed).toHaveLength(1);
  });

  it('notices a file that was modified', () => {
    const { changed } = selectChanged([file('/a.mkv', { modifiedAtMs: 2000 })], [stored('/a.mkv')]);

    expect(changed).toHaveLength(1);
  });

  it('reports files that are no longer on disk', () => {
    const { missing } = selectChanged([file('/a.mkv')], [stored('/a.mkv'), stored('/gone.mkv')]);

    expect(missing).toEqual(['/gone.mkv']);
  });

  it('reads a file again when the rules that read it last time have changed', () => {
    const { changed } = selectChanged([file('/a.mkv')], [stored('/a.mkv', { probeVersion: 1 })], 2);

    expect(changed).toHaveLength(1);
  });

  it('leaves a file alone when the rules are the ones it was read under', () => {
    const { changed } = selectChanged([file('/a.mkv')], [stored('/a.mkv', { probeVersion: 2 })], 2);

    expect(changed).toHaveLength(0);
  });

  it('reads a file again when nothing recorded which rules read it', () => {
    const { changed } = selectChanged(
      [file('/a.mkv')],
      [stored('/a.mkv', { probeVersion: null })],
      1,
    );

    expect(changed).toHaveLength(1);
  });

  it('leaves the whole library alone when the rules in force are not known', () => {
    const { changed } = selectChanged(
      [file('/a.mkv'), file('/b.mkv')],
      [stored('/a.mkv', { probeVersion: 1 }), stored('/b.mkv', { probeVersion: null })],
    );

    expect(changed).toHaveLength(0);
  });
});

describe('scanLibrary', () => {
  it('adds new media', async () => {
    const { run, rows } = harness({ found: [file('/media/films/Arrival (2016).mkv')] });

    const result = await run();

    expect(result).toMatchObject({ added: 1, updated: 0, removed: 0, failed: 0 });
    expect(rows[0]).toMatchObject({ title: 'Arrival', year: 2016, libraryId: LIBRARY_ID });
  });

  it('ignores files that are not media', async () => {
    const { run, rows } = harness({
      found: [file('/media/films/poster.jpg'), file('/media/films/film.nfo')],
    });

    const result = await run();

    expect(result.added).toBe(0);
    expect(rows).toHaveLength(0);
  });

  it('does not re-probe an unchanged file', async () => {
    const probeSpy = vi.fn(() => Promise.resolve(probe()));
    const { run } = harness({
      found: [file('/a.mkv')],
      existing: [stored('/a.mkv')],
      probeImpl: probeSpy,
    });

    await run();

    expect(probeSpy).not.toHaveBeenCalled();
  });

  it('counts a re-probed file as updated rather than added', async () => {
    const { run } = harness({
      found: [file('/a.mkv', { sizeBytes: 5000 })],
      existing: [stored('/a.mkv')],
    });

    expect(await run()).toMatchObject({ added: 0, updated: 1 });
  });

  it('removes rows for files that disappeared from a library still holding others', async () => {
    const { run, removedPaths } = harness({
      found: [file('/kept.mkv')],
      existing: [stored('/kept.mkv'), stored('/gone.mkv')],
    });

    expect(await run()).toMatchObject({ removed: 1 });
    expect(removedPaths).toEqual(['/gone.mkv']);
  });

  it('keeps rows for files under a folder the walk could not read', async () => {
    const { run, removedPaths } = harness({
      found: [file('/media/films/Kept.mkv')],
      unreadable: ['/media/films/4K'],
      existing: [stored('/media/films/Kept.mkv'), stored('/media/films/4K/Dune.mkv')],
    });

    expect(await run()).toMatchObject({ removed: 0 });
    expect(removedPaths).toEqual([]);
  });

  it('still removes what really went, from the folders it could read', async () => {
    const { run, removedPaths } = harness({
      found: [file('/media/films/Kept.mkv')],
      unreadable: ['/media/films/4K'],
      existing: [
        stored('/media/films/Kept.mkv'),
        stored('/media/films/4K/Dune.mkv'),
        stored('/media/films/Gone.mkv'),
      ],
    });

    expect(await run()).toMatchObject({ removed: 1 });
    expect(removedPaths).toEqual(['/media/films/Gone.mkv']);
  });

  it('keeps scanning after a file fails to probe', async () => {
    const probeImpl = vi.fn((path: string) =>
      path.includes('broken')
        ? Promise.reject(new Error('moov atom not found'))
        : Promise.resolve(probe()),
    );

    const { run, rows } = harness({
      found: [file('/broken.mkv'), file('/good.mkv')],
      probeImpl,
    });

    const result = await run();

    expect(result).toMatchObject({ added: 1, failed: 1 });
    expect(rows).toHaveLength(1);
  });

  it('reports why a file failed', async () => {
    const problems: string[] = [];

    await scanLibrary({
      libraryId: LIBRARY_ID,
      kind: 'movies',
      root: '/media',
      files: { listFiles: () => Promise.resolve({ files: [file('/broken.mkv')], unreadable: [] }) },
      store: {
        listStored: () => Promise.resolve([]),
        upsert: () => Promise.resolve('item-1'),
        removeByPaths: () => Promise.resolve([]),
        markScanned: () => Promise.resolve(),
      },
      transcoder: {
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
        probe: () => Promise.reject(new Error('moov atom not found')),
        startSession: () =>
          Promise.resolve({ id: 'x', manifest: '/x', encodesVideo: false, reuse: 'none' as const }),
        readSessionFile: () => Promise.resolve(null),
        readFile: () => Promise.resolve(null),
        readAudioRendition: () => Promise.resolve(null),
        fingerprint: () =>
          Promise.resolve({ framesPerSecond: 15.625, startSeconds: 0, hashes: [] }),
        requestTrickplay: () =>
          Promise.resolve({
            id: 'thumbs',
            intervalSeconds: 10,
            tileWidth: 320,
            tileHeight: 180,
            columns: 10,
            rows: 10,
            sheets: [],
            isReady: true,
            index: '/trickplay/thumbs/thumbnails.vtt',
          }),
        readTrickplayFile: () => Promise.resolve(null),
        stopSession: () => Promise.resolve(true),
        heartbeatSession: () => Promise.resolve(true),
        readSubtitle: () => Promise.resolve('WEBVTT\n'),
        readFrame: () => Promise.resolve(new ArrayBuffer(0)),
        requestPreview: () => Promise.resolve({ id: 'p', url: '/p', isReady: true }),
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
      },
      onProblem: (path, reason) => problems.push(`${path}: ${reason}`),
    });

    expect(problems).toEqual(['/broken.mkv: moov atom not found']);
  });

  it('skips a file with no video stream', async () => {
    const { run, rows } = harness({
      found: [file('/audio-only.mkv')],
      probeImpl: () => Promise.resolve({ ...probe(), video: null }),
    });

    expect(await run()).toMatchObject({ added: 0, failed: 1 });
    expect(rows).toHaveLength(0);
  });

  it('records when the library was scanned', async () => {
    const { run, markScanned } = harness({ found: [] });

    await run();

    expect(markScanned).toHaveBeenCalledOnce();
  });

  it('does not touch the store when nothing is missing', async () => {
    const { run, removedPaths } = harness({
      found: [file('/a.mkv')],
      existing: [stored('/a.mkv')],
    });

    expect(await run()).toMatchObject({ removed: 0 });
    expect(removedPaths).toHaveLength(0);
  });

  it('lets a provider override the filename title', async () => {
    const { run, rows } = harness({
      found: [file('/media/films/arrival.2016.1080p.mkv')],
      providers: [
        { name: 'plugin', describe: () => Promise.resolve({ title: 'Arrival', year: 2016 }) },
      ],
    });

    await run();

    expect(rows[0]).toMatchObject({ title: 'Arrival', year: 2016 });
  });

  it('tells a provider what a changed file was already matched to', async () => {
    let remembered: string | null | undefined;
    const { run } = harness({
      found: [file('/media/films/arrival.2016.1080p.mkv', { sizeBytes: 2000 })],
      existing: [stored('/media/films/arrival.2016.1080p.mkv', { externalId: '329' })],
      providers: [
        {
          name: 'plugin',
          describe: (facts) => {
            remembered = facts.rememberedExternalId;
            return Promise.resolve({ title: 'Arrival', year: 2016 });
          },
        },
      ],
    });

    await run();

    expect(remembered).toBe('329');
  });

  it('matches every file again from its name on a forced rescan, which is how a wrong match is put right', async () => {
    let remembered: string | null | undefined = 'untouched';
    const { run } = harness({
      found: [file('/media/films/arrival.2016.1080p.mkv')],
      existing: [stored('/media/films/arrival.2016.1080p.mkv', { externalId: '329' })],
      force: true,
      providers: [
        {
          name: 'plugin',
          describe: (facts) => {
            remembered = facts.rememberedExternalId;
            return Promise.resolve({ title: 'Arrival', year: 2016, externalId: '329' });
          },
        },
      ],
    });

    await run();

    expect(remembered).toBeNull();
  });

  it('keeps what a catalogue said before rather than writing a filename over it', async () => {
    const { run, rows } = harness({
      found: [file('/media/films/arrival.2016.1080p.mkv')],
      existing: [stored('/media/films/arrival.2016.1080p.mkv', { externalId: '329' })],
      force: true,
      providers: [
        {
          name: 'filename',
          describe: () => Promise.resolve({ title: 'arrival.2016.1080p', year: null }),
        },
      ],
    });

    const result = await run();

    expect(rows).toHaveLength(0);
    expect(result.failed).toBe(1);
  });

  it('says why it kept what it had, rather than passing over it in silence', async () => {
    const problems: string[] = [];
    const { run } = harness({
      found: [file('/media/films/arrival.2016.1080p.mkv')],
      existing: [stored('/media/films/arrival.2016.1080p.mkv', { externalId: '329' })],
      force: true,
      providers: [
        {
          name: 'filename',
          describe: () => Promise.resolve({ title: 'arrival.2016.1080p', year: null }),
        },
      ],
      onProblem: (_path, reason) => problems.push(reason),
    });

    await run();

    expect(problems.join(' ')).toContain('catalogue did not answer');
  });

  it('still writes the answer when the catalogue is the one giving it', async () => {
    const { run, rows } = harness({
      found: [file('/media/films/arrival.2016.1080p.mkv')],
      existing: [stored('/media/films/arrival.2016.1080p.mkv', { externalId: '329' })],
      force: true,
      providers: [
        {
          name: 'catalogue',
          describe: () => Promise.resolve({ title: 'Arrival', year: 2016, externalId: '329' }),
        },
      ],
    });

    await run();

    expect(rows).toHaveLength(1);
  });

  it('writes a filename answer for a file nothing had matched before', async () => {
    const { run, rows } = harness({
      found: [file('/media/films/unknown.mkv')],
      providers: [
        { name: 'filename', describe: () => Promise.resolve({ title: 'unknown', year: null }) },
      ],
    });

    await run();

    expect(rows).toHaveLength(1);
  });

  it('tells a provider nothing was known yet for a file never matched before', async () => {
    let seenKnownExternalId: string | null | undefined;
    const { run } = harness({
      found: [file('/media/films/arrival.2016.1080p.mkv')],
      providers: [
        {
          name: 'plugin',
          describe: (facts) => {
            seenKnownExternalId = facts.knownExternalId;
            return Promise.resolve({ title: 'Arrival', year: 2016 });
          },
        },
      ],
    });

    await run();

    expect(seenKnownExternalId).toBeNull();
  });

  it('counts a file no provider can name as failed rather than storing it blank', async () => {
    const onProblem = vi.fn();
    const { run, rows } = harness({
      found: [file('/media/films/arrival.mkv')],
      providers: [{ name: 'plugin', describe: () => Promise.resolve(null) }],
      onProblem,
    });

    const result = await run();

    expect(result.failed).toBe(1);
    expect(rows).toHaveLength(0);
    expect(onProblem).toHaveBeenCalled();
  });

  it('probes every file again when forced', async () => {
    const probeSpy = vi.fn(() => Promise.resolve(probe()));
    const { run, rows } = harness({
      found: [file('/a.mkv'), file('/b.mkv')],
      existing: [stored('/a.mkv'), stored('/b.mkv')],
      probeImpl: probeSpy,
      force: true,
    });

    const result = await run();

    expect(probeSpy).toHaveBeenCalledTimes(2);
    expect(rows).toHaveLength(2);
    expect(result.updated).toBe(2);
  });

  it('still removes files that disappeared when forced', async () => {
    const { run, removedPaths } = harness({
      found: [file('/a.mkv')],
      existing: [stored('/a.mkv'), stored('/gone.mkv')],
      force: true,
    });

    const result = await run();

    expect(removedPaths).toEqual(['/gone.mkv']);
    expect(result.removed).toBe(1);
  });

  it('reports probing progress against the files it is actually walking, not everything on disk', async () => {
    const onProgress = vi.fn();
    const { run } = harness({
      found: [file('/a.mkv'), file('/b.mkv')],
      existing: [stored('/a.mkv')],
      onProgress,
    });

    await run();

    expect(onProgress).toHaveBeenCalledWith('probing', 0, 1);
    expect(onProgress).toHaveBeenCalledWith('probing', 1, 1, 'b');
    expect(onProgress).toHaveBeenCalledTimes(2);
  });

  it('names the file it is on, so a count that only ticks says what it is doing', async () => {
    const onProgress = vi.fn();
    const { run } = harness({ found: [file('/Arrival (2016).mkv')], onProgress });

    await run();

    expect(onProgress).toHaveBeenLastCalledWith('probing', 1, 1, 'Arrival 2016');
  });

  it('still counts a failed probe toward progress', async () => {
    const onProgress = vi.fn();
    const { run } = harness({
      found: [file('/a.mkv'), file('/b.mkv')],
      probeImpl: (path) =>
        path === '/a.mkv' ? Promise.reject(new Error('boom')) : Promise.resolve(probe()),
      onProgress,
    });

    await run();

    expect(onProgress).toHaveBeenLastCalledWith('probing', 2, 2, expect.any(String));
  });
});

describe('a correction somebody made', () => {
  it('is what the provider is asked about, not what was matched before', async () => {
    let asked: string | null | undefined;
    const { run } = harness({
      found: [file('/media/films/from.s01e01.mkv')],
      existing: [stored('/media/films/from.s01e01.mkv', { externalId: '111' })],
      overrides: [{ path: '/media/films/from.s01e01.mkv', externalId: '222', externalKind: 'tv' }],
      force: true,
      providers: [
        {
          name: 'catalogue',
          describe: (facts) => {
            asked = facts.knownExternalId;

            return Promise.resolve({ title: 'From', year: 2022, externalId: '222' });
          },
        },
      ],
    });

    await run();

    expect(asked).toBe('222');
  });

  it('reaches a season that did not exist when it was made', async () => {
    const asked: (string | null | undefined)[] = [];
    const { run } = harness({
      kind: 'shows',
      root: '/media/shows',
      found: [
        file('/media/shows/From/Season 01/from.s01e01.mkv'),
        file('/media/shows/From/Season 02/from.s02e01.mkv'),
      ],
      existing: [stored('/media/shows/From/Season 01/from.s01e01.mkv', { externalId: '222' })],
      overrides: [
        {
          path: '/media/shows/From/Season 01/from.s01e01.mkv',
          externalId: '222',
          externalKind: 'tv',
        },
      ],
      providers: [
        {
          name: 'catalogue',
          describe: (facts) => {
            asked.push(facts.knownExternalId);

            return Promise.resolve({ title: 'From', year: 2022, externalId: '222' });
          },
        },
      ],
    });

    await run();

    expect(asked).toEqual(['222']);
  });

  it('does not reach a film that merely shares a folder with a corrected one', async () => {
    const asked: (string | null | undefined)[] = [];
    const { run } = harness({
      found: [file('/media/films/one.mkv'), file('/media/films/another.mkv')],
      overrides: [{ path: '/media/films/one.mkv', externalId: '222', externalKind: 'movie' }],
      providers: [
        {
          name: 'catalogue',
          describe: (facts) => {
            asked.push(facts.knownExternalId);

            return Promise.resolve({ title: 'A film', year: 2022, externalId: '9' });
          },
        },
      ],
    });

    await run();

    expect(asked.filter((one) => one === '222')).toHaveLength(1);
  });

  it('says which catalogue the id belongs to, since the number alone cannot', async () => {
    let asked: string | undefined;
    const { run } = harness({
      found: [file('/media/films/some.file.mkv')],
      overrides: [{ path: '/media/films/some.file.mkv', externalId: '9', externalKind: 'movie' }],
      providers: [
        {
          name: 'catalogue',
          describe: (facts) => {
            asked = facts.knownExternalKind;

            return Promise.resolve({ title: 'A film', year: 2000, externalId: '9' });
          },
        },
      ],
    });

    await run();

    expect(asked).toBe('movie');
  });

  it('is read again on every scan, which is what makes it outlive one', async () => {
    const seen: (string | null | undefined)[] = [];
    const build = () =>
      harness({
        found: [file('/media/films/a.mkv')],
        overrides: [{ path: '/media/films/a.mkv', externalId: '42', externalKind: 'tv' }],
        force: true,
        providers: [
          {
            name: 'catalogue',
            describe: (facts) => {
              seen.push(facts.knownExternalId);

              return Promise.resolve({ title: 'A', year: 2000, externalId: '42' });
            },
          },
        ],
      });

    await build().run();
    await build().run();

    expect(seen).toEqual(['42', '42']);
  });

  it('leaves a file nobody corrected to whatever it was matched to', async () => {
    let asked: { known: string | null | undefined; remembered: string | null | undefined } = {
      known: undefined,
      remembered: undefined,
    };
    const { run } = harness({
      found: [file('/media/films/b.mkv', { sizeBytes: 2000 })],
      existing: [stored('/media/films/b.mkv', { externalId: '777' })],
      providers: [
        {
          name: 'catalogue',
          describe: (facts) => {
            asked = { known: facts.knownExternalId, remembered: facts.rememberedExternalId };

            return Promise.resolve({ title: 'B', year: 2000, externalId: '777' });
          },
        },
      ],
    });

    await run();

    expect(asked).toEqual({ known: null, remembered: '777' });
  });
});

describe('a scan somebody stopped partway', () => {
  it('keeps what it read and deletes nothing', async () => {
    let seen = 0;

    const { run, rows, removedPaths } = harness({
      found: [file('/a.mkv'), file('/b.mkv')],
      existing: [stored('/gone.mkv')],
      isCancelled: () => {
        seen += 1;

        return seen > 1;
      },
    });

    const result = await run();

    expect(rows.map((row) => row.path)).toEqual(['/a.mkv']);
    expect(removedPaths).toEqual([]);
    expect(result.removed).toBe(0);
  });

  it('leaves the library unscanned so the next scan finishes the job', async () => {
    const { run, markScanned } = harness({
      found: [file('/a.mkv'), file('/b.mkv')],
      isCancelled: () => true,
    });

    await run();

    expect(markScanned).not.toHaveBeenCalled();
  });

  it('says that it was stopped rather than leaving it to be guessed at', async () => {
    const problems: string[] = [];

    const { run } = harness({
      found: [file('/a.mkv')],
      isCancelled: () => true,
      onProblem: (_path, reason) => {
        problems.push(reason);
      },
    });

    await run();

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('stopped');
  });
});

describe('a library holding extras', () => {
  const FILM = '/media/films/Arrival (2016)/Arrival (2016).mkv';
  const MAKING_OF = '/media/films/Arrival (2016)/Featurettes/Scoring.mkv';

  it('says what sort of extra each one is, and nothing for what is not one', async () => {
    const { run, rows } = harness({ found: [file(FILM), file(MAKING_OF)] });

    await run();

    expect(rows.find((row) => row.path === FILM)?.extraKind).toBeNull();
    expect(rows.find((row) => row.path === MAKING_OF)?.extraKind).toBe('featurette');
  });

  it('hangs it off the film once both are written, rather than while one is half there', async () => {
    const linkExtras = vi.fn().mockResolvedValue(undefined);

    await harness({ found: [file(FILM), file(MAKING_OF)], linkExtras }).run();

    expect(linkExtras).toHaveBeenCalledWith(LIBRARY_ID, [{ path: MAKING_OF, parentPath: FILM }]);
  });

  it('lets go of a version that is no longer one, keeping the ones that still are', async () => {
    const forgetStaleVersions = vi.fn().mockResolvedValue(undefined);
    const folder = '/media/films/Parasite (2019)';

    await harness({
      found: [file(`${folder}/Parasite (2019).mkv`), file(`${folder}/Parasite (2019) - B&W.mkv`)],
      forgetStaleVersions,
    }).run();

    expect(forgetStaleVersions).toHaveBeenCalledWith(LIBRARY_ID, [
      `${folder}/Parasite (2019) - B&W.mkv`,
    ]);
  });

  it('keeps the version links of films under a folder the walk could not read', async () => {
    const forgetStaleVersions = vi.fn().mockResolvedValue(undefined);

    await harness({
      found: [file(FILM)],
      unreadable: ['/media/films/4K'],
      existing: [stored(FILM), stored('/media/films/4K/Dune - Extended.mkv')],
      forgetStaleVersions,
    }).run();

    expect(forgetStaleVersions).toHaveBeenCalledWith(LIBRARY_ID, [
      '/media/films/4K/Dune - Extended.mkv',
    ]);
  });

  it('never takes episodes numbered only by a number for versions of one another', async () => {
    const linkExtras = vi.fn().mockResolvedValue(undefined);
    const folder = '/media/shows/Bluey';

    await harness({
      kind: 'shows',
      root: '/media/shows',
      found: [file(`${folder}/Bluey - 01.mkv`), file(`${folder}/Bluey - 02.mkv`)],
      linkExtras,
    }).run();

    expect(linkExtras).not.toHaveBeenCalled();
  });

  it('lets go of nothing on a scan of part of the library, which cannot see every version', async () => {
    const forgetStaleVersions = vi.fn().mockResolvedValue(undefined);

    await harness({ found: [file(FILM)], isPartial: true, forgetStaleVersions }).run();

    expect(forgetStaleVersions).not.toHaveBeenCalled();
  });

  it('does not announce an extra as something that arrived', async () => {
    const arrived: string[] = [];

    await harness({
      found: [file(FILM), file(MAKING_OF)],
      onAdded: (item) => arrived.push(item.title),
    }).run();

    expect(arrived).toEqual(['Arrival']);
  });

  it('gives a programme its extras without pretending they are episodes', async () => {
    const { run, rows } = harness({
      kind: 'shows',
      root: '/media/tv',
      found: [
        file('/media/tv/Some Show/Season 1/Some.Show.S01E01.mkv'),
        file('/media/tv/Some Show/Extras/Making Of.mkv'),
      ],
    });

    await run();

    const extra = rows.find((row) => row.path === '/media/tv/Some Show/Extras/Making Of.mkv');

    expect(extra?.extraKind).toBe('other');
    expect(extra?.episode.seriesTitle).toBe('Some Show');
    expect(extra?.episode.episodeNumber).toBeNull();
  });
});

describe('how many files a scan reads at once', () => {
  const many = () => Array.from({ length: 12 }, (_, at) => file(`/media/films/Film ${at}.mkv`));

  const watchingConcurrency = () => {
    let inFlight = 0;
    let mostAtOnce = 0;

    const probeImpl = async () => {
      inFlight += 1;
      mostAtOnce = Math.max(mostAtOnce, inFlight);

      await new Promise((resolve) => setTimeout(resolve, 5));

      inFlight -= 1;

      return probe();
    };

    return { probeImpl, mostAtOnce: () => mostAtOnce };
  };

  it('reads one at a time unless told otherwise, which is what it always did', async () => {
    const watching = watchingConcurrency();

    await harness({ found: many(), probeImpl: watching.probeImpl }).run();

    expect(watching.mostAtOnce()).toBe(1);
  });

  it('reads several at once when a library asks for it', async () => {
    const watching = watchingConcurrency();

    await harness({ found: many(), probeImpl: watching.probeImpl, atOnce: 4 }).run();

    expect(watching.mostAtOnce()).toBe(4);
  });

  it('still reads every one of them, and counts them once each', async () => {
    const { run, rows } = harness({ found: many(), atOnce: 4 });
    const result = await run();

    expect(rows).toHaveLength(12);
    expect(result.added).toBe(12);
  });

  it('still reports progress for every file', async () => {
    const seen: number[] = [];

    await harness({
      found: many(),
      atOnce: 4,
      onProgress: (_phase, processed) => seen.push(processed),
    }).run();

    expect(seen.at(-1)).toBe(12);
  });
});

describe('a media service that goes away mid-scan', () => {
  const many = () => Array.from({ length: 60 }, (_, at) => file(`/media/films/Film ${at}.mkv`));

  it('gives up rather than reporting the whole library as unreadable', async () => {
    const { run, rows } = harness({
      found: many(),
      probeImpl: () => Promise.reject(new Error('fetch failed')),
      capabilitiesImpl: () => Promise.reject(new Error('fetch failed')),
    });

    const result = await run();

    expect(result.failed).toBeLessThan(20);
    expect(rows).toHaveLength(0);
  });

  it('says the service stopped answering, rather than blaming the files', async () => {
    const problems: string[] = [];

    await harness({
      found: many(),
      probeImpl: () => Promise.reject(new Error('fetch failed')),
      capabilitiesImpl: () => Promise.reject(new Error('fetch failed')),
      onProblem: (_path, reason) => problems.push(reason),
    }).run();

    expect(problems.some((reason) => reason.includes('media service stopped answering'))).toBe(
      true,
    );
  });

  it('does not count a scan that gave up as having removed anything', async () => {
    const { run } = harness({
      found: many(),
      existing: [stored('/media/films/Gone.mkv')],
      probeImpl: () => Promise.reject(new Error('fetch failed')),
      capabilitiesImpl: () => Promise.reject(new Error('fetch failed')),
    });

    expect((await run()).removed).toBe(0);
  });

  it('keeps going where the service is fine and the file simply is not', async () => {
    const { run } = harness({
      found: many(),
      probeImpl: () => Promise.reject(new Error('Invalid data found')),
    });

    expect((await run()).failed).toBe(60);
  });

  it('says what actually went wrong, not only that something did', async () => {
    const problems: string[] = [];

    await harness({
      found: [file('/media/films/One.mkv')],
      probeImpl: () =>
        Promise.reject(new Error('fetch failed', { cause: new Error('read ECONNRESET') })),
      onProblem: (_path, reason) => problems.push(reason),
    }).run();

    expect(problems[0]).toBe('fetch failed: read ECONNRESET');
  });
});

describe('what is worth reading a file again for', () => {
  const held = (changes: Partial<StoredItem> = {}): StoredItem =>
    stored('/media/films/Arrival (2016).mkv', changes);

  it('does not read a file again just because nothing said whether it can be copied', () => {
    const { changed } = selectChanged(
      [file('/media/films/Arrival (2016).mkv')],
      [held({ canCopySegments: null })],
    );

    expect(changed).toEqual([]);
  });

  it('still reads one again where the probe itself is incomplete', () => {
    const { changed } = selectChanged(
      [file('/media/films/Arrival (2016).mkv')],
      [held({ videoFrameRate: null })],
    );

    expect(changed).toHaveLength(1);
  });

  it('still reads one again where the file itself has moved on', () => {
    const { changed } = selectChanged(
      [file('/media/films/Arrival (2016).mkv', { sizeBytes: 999 })],
      [held()],
    );

    expect(changed).toHaveLength(1);
  });
});

describe('a programme split in two by a catalogue that answered for only some of it', () => {
  const SHOWS = '/media/shows';

  const patchy = (answers: Record<string, string>): MetadataProvider => ({
    name: 'patchy',
    describe: (facts) => {
      const externalId = answers[facts.path];

      return Promise.resolve(
        externalId === undefined
          ? {
              title: facts.episode?.episodeTitle ?? 'Untitled',
              year: null,
              ...(facts.episode?.seriesTitle === null || facts.episode?.seriesTitle === undefined
                ? {}
                : { seriesTitle: facts.episode.seriesTitle }),
            }
          : {
              title: 'Known Episode',
              year: 1999,
              seriesTitle: 'Curb Your Enthusiasm',
              externalId,
            },
      );
    },
  });

  const keysOf = (rows: MediaRow[]): Set<string | null> =>
    new Set(
      rows.map((row) =>
        resolveSeriesKey({
          externalId: row.metadata.externalId ?? null,
          seriesFolder: row.episode.seriesFolder,
          seriesTitle: row.metadata.seriesTitle ?? row.episode.seriesTitle,
        }),
      ),
    );

  it('keeps every season of one folder in one programme', async () => {
    const answered = `${SHOWS}/Curb Your Enthusiasm/Season 11/Curb.S11E01.mkv`;
    const missed = `${SHOWS}/Curb Your Enthusiasm/Season 1/Curb.S01E01.mkv`;

    const { run, rows } = harness({
      kind: 'shows',
      root: SHOWS,
      found: [file(answered), file(missed)],
      providers: [patchy({ [answered]: '4546' })],
    });

    await run();

    expect(rows).toHaveLength(2);
    expect(keysOf(rows)).toEqual(new Set(['folder:/media/shows/Curb Your Enthusiasm']));
  });

  it('keeps episodes of one flat folder together when half of them missed', async () => {
    const answered = `${SHOWS}/Unsolved (2018)/Unsolved.S01E05.mkv`;
    const missed = `${SHOWS}/Unsolved (2018)/Unsolved.S01E01.mkv`;

    const { run, rows } = harness({
      kind: 'shows',
      root: SHOWS,
      found: [file(answered), file(missed)],
      providers: [patchy({ [answered]: '101605' })],
    });

    await run();

    expect(keysOf(rows)).toEqual(new Set(['folder:/media/shows/Unsolved (2018)']));
  });

  it('holds a programme together when a stray file writes its name differently', async () => {
    const usual = `${SHOWS}/Euphoria (US)/Euphoria.S01E01.mkv`;
    const stray = `${SHOWS}/Euphoria (US)/Euphoria US S03E01 Andale.mkv`;

    const { run, rows } = harness({
      kind: 'shows',
      root: SHOWS,
      found: [file(usual), file(stray)],
      providers: [patchy({})],
    });

    await run();

    expect(keysOf(rows)).toEqual(new Set(['folder:/media/shows/Euphoria (US)']));
    expect(new Set(rows.map((row) => row.episode.seriesTitle))).toEqual(new Set(['Euphoria (US)']));
  });

  it('names every episode of a folder after the folder, whatever each file called it', async () => {
    const { run, rows } = harness({
      kind: 'shows',
      root: SHOWS,
      found: [
        file(`${SHOWS}/The Office (US)/The Office - S04E01.mkv`),
        file(`${SHOWS}/The Office (US)/The Office US S04E03 04 Dunder Mifflin Infinity.mkv`),
      ],
      providers: [patchy({})],
    });

    await run();

    expect(new Set(rows.map((row) => row.episode.seriesTitle))).toEqual(
      new Set(['The Office (US)']),
    );
  });
});

describe('a folder below a programme, which is never a programme of its own', () => {
  const SHOWS = '/media/shows';

  it('files a programme’s specials under the programme rather than beside it', async () => {
    const episode = `${SHOWS}/The Fall/The Fall - S01E01 - Dark Descent.mkv`;
    const first = `${SHOWS}/The Fall/Specials/Deleted Scenes 1.mkv`;
    const second = `${SHOWS}/The Fall/Specials/Deleted Scenes 2.mkv`;

    const { run, rows } = harness({
      kind: 'shows',
      root: SHOWS,
      found: [file(episode), file(first), file(second)],
    });

    await run();

    expect(new Set(rows.map((row) => row.episode.seriesFolder))).toEqual(
      new Set(['/media/shows/The Fall']),
    );
    expect(new Set(rows.map((row) => row.episode.seriesTitle))).toEqual(new Set(['The Fall']));
  });

  it('keeps the name of a special, which is the only thing telling two of them apart', async () => {
    const { run, rows } = harness({
      kind: 'shows',
      root: SHOWS,
      found: [
        file(`${SHOWS}/The Fall/The Fall - S01E01 - Dark Descent.mkv`),
        file(`${SHOWS}/The Fall/Specials/Deleted Scenes 1.mkv`),
        file(`${SHOWS}/The Fall/Specials/Deleted Scenes 2.mkv`),
      ],
    });

    await run();

    const specials = rows.filter((row) => row.episode.seasonNumber === 0);

    expect(specials.map((row) => row.episode.episodeTitle).sort()).toEqual([
      'Deleted Scenes 1',
      'Deleted Scenes 2',
    ]);
  });

  it('takes the folder at the top of the library as the programme, whatever is filed below it', async () => {
    const { run, rows } = harness({
      kind: 'shows',
      root: SHOWS,
      found: [
        file(`${SHOWS}/Avatar The Last Airbender/Book 1 Water/Avatar S01E01.mkv`),
        file(`${SHOWS}/Avatar The Last Airbender/Book 2 Earth/Avatar S02E01.mkv`),
      ],
    });

    await run();

    expect(new Set(rows.map((row) => row.episode.seriesFolder))).toEqual(
      new Set([`${SHOWS}/Avatar The Last Airbender`]),
    );
  });
});

describe('an episode whose lookup failed while its neighbours succeeded', () => {
  const SHOWS = '/media/shows';

  it('reads it from the programme its folder already named', async () => {
    const asked: (string | null | undefined)[] = [];

    const provider: MetadataProvider = {
      name: 'remembering',
      describe: (facts) => {
        asked.push(facts.rememberedExternalId);

        return Promise.resolve({ title: 'An Episode', year: null, seriesTitle: 'The Fall' });
      },
    };

    const { run } = harness({
      kind: 'shows',
      root: SHOWS,
      found: [file(`${SHOWS}/The Fall/The Fall - S01E02.mkv`)],
      existing: [stored(`${SHOWS}/The Fall/The Fall - S01E01.mkv`, { externalId: '2085' })],
      providers: [provider],
    });

    await run();

    expect(asked).toEqual(['2085']);
  });

  it('asks nothing of a film, which belongs to no programme', async () => {
    const asked: (string | null | undefined)[] = [];

    const provider: MetadataProvider = {
      name: 'remembering',
      describe: (facts) => {
        asked.push(facts.knownExternalId);

        return Promise.resolve({ title: 'A Film', year: 2016 });
      },
    };

    const { run } = harness({
      root: '/media/films',
      found: [file('/media/films/Arrival (2016)/Arrival (2016).mkv')],
      existing: [
        stored('/media/films/Arrival (2016)/Arrival (2016) extras.mkv', {
          externalId: '329',
        }),
      ],
      providers: [provider],
    });

    await run();

    expect(asked).toEqual([null]);
  });
});

describe('a film, which belongs to no programme however it is filed', () => {
  it('is given no programme by the folder it sits in', async () => {
    const { run, rows } = harness({
      root: '/media/films',
      found: [file('/media/films/Arrival (2016)/Arrival (2016) Bluray-1080p.mkv')],
    });

    await run();

    expect(rows[0]?.episode.seriesTitle).toBeNull();
    expect(rows[0]?.episode.seriesFolder).toBeNull();
  });

  it('is left off the shelf of programmes entirely', async () => {
    const { run, rows } = harness({
      root: '/media/films',
      found: [file('/media/films/Arrival (2016)/Arrival (2016).mkv')],
    });

    await run();

    expect(
      resolveSeriesKey({
        externalId: rows[0]?.metadata.externalId ?? null,
        seriesFolder: rows[0]?.episode.seriesFolder ?? null,
        seriesTitle: rows[0]?.metadata.seriesTitle ?? rows[0]?.episode.seriesTitle ?? null,
      }),
    ).toBeNull();
  });
});

describe('a season filed under a numbered folder', () => {
  it('reads the number as the season, since it sits inside the programme', async () => {
    const { run, rows } = harness({
      kind: 'shows',
      root: '/media/shows',
      found: [
        file('/media/shows/Some Show/01/Some Show ep 1.mkv'),
        file('/media/shows/Some Show/01/Some Show ep 2.mkv'),
      ],
    });

    await run();

    expect(new Set(rows.map((row) => row.episode.seasonNumber))).toEqual(new Set([1]));
  });

  it('does not read a programme called 24 as a twenty-fourth season', async () => {
    const { run, rows } = harness({
      kind: 'shows',
      root: '/media/shows',
      found: [file('/media/shows/24/24.S02E01.mkv')],
    });

    await run();

    expect(rows[0]?.episode.seasonNumber).toBe(2);
    expect(rows[0]?.episode.seriesFolder).toBe('/media/shows/24');
  });
});
