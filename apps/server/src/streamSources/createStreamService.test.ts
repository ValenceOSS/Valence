import { describe, expect, it, vi } from 'vitest';
import type { ResolveAnswer } from '@ValenceSDK/sources/ResolveAnswerSchema';
import type { MediaRow } from '@ValenceServer/library/scanLibrary';
import type { MediaProbe } from '@ValenceServer/transcoder/TranscoderClient';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { StreamedChoice } from './createDatabaseStreamedFilms';
import { createStreamService } from './createStreamService';

const TITLE = {
  kind: 'film',
  catalogueId: '603',
  tmdbId: '603',
  imdbId: 'tt0133093',
  title: 'A film',
  year: 1999,
} as const;

const PROBE: MediaProbe = {
  container: 'mkv',
  durationSeconds: 60,
  bitrateKbps: 1000,
  video: {
    index: 0,
    codec: 'h264',
    codecTag: null,
    width: 1920,
    height: 1080,
    range: 'SDR',
    rangeBase: 'SDR',
    bitrateKbps: 1000,
    bitDepth: 8,
    level: 40,
    frameRate: 24,
    isInterlaced: false,
    refFrames: 4,
    pixelAspect: null,
    rotationDegrees: null,
  },
  audioStreams: [],
  subtitleStreams: [
    {
      index: 2,
      format: 'subrip',
      language: 'eng',
      title: null,
      isDefault: false,
      isForced: false,
      isImageBased: false,
    },
  ],
  chapters: [],
};

const HELD = {
  pluginId: 'example-files',
  sourceId: 'files',
  sourceName: 'Example files',
  stream: {
    key: 'a',
    name: 'Film.1999.1080p',
    infoHash: null,
    isReady: true,
    sizeBytes: 10,
    fileName: null,
  },
  title: TITLE,
};

const READY: ResolveAnswer = {
  kind: 'ready',
  url: 'https://eu1.files.example.test/a',
  fileName: 'film.mkv',
  sizeBytes: 10,
  expiresAt: null,
};

const build = ({
  answer = READY,
  existing = null,
  chosen = null,
  outOfReach = false,
  probe = PROBE,
  mayWatchUpTo = Infinity,
  isWatched = false,
}: {
  answer?: ResolveAnswer;
  existing?: string | null;
  chosen?: StreamedChoice | null;
  outOfReach?: boolean;
  probe?: MediaProbe;
  mayWatchUpTo?: number;
  isWatched?: boolean;
} = {}) => {
  const rows: MediaRow[] = [];
  const choose = vi.fn(() => Promise.resolve());
  const remember = vi.fn();
  const register = vi.fn(() => Promise.resolve());
  const resolve = vi.fn(() => Promise.resolve(answer));
  const service = createStreamService({
    offers: {
      offersFor: () => Promise.resolve({ offers: [], problems: [] }),
      held: (id) => (id === 'offer-1' ? HELD : null),
    },
    films: {
      libraryId: () => Promise.resolve('streamed-library'),
      itemOf: () => Promise.resolve(existing),
      choiceOf: () => Promise.resolve(chosen),
      choose,
    },
    links: { remember },
    source: () => ({ resolve }),
    linkHostsOf: () => Promise.resolve(['*.files.example.test']),
    register,
    probeRemote: () => Promise.resolve(probe),
    probeVersion: () => Promise.resolve(7),
    describeFilm: () => Promise.resolve({ title: 'A Film', year: 1999, posterUrl: 'p.jpg' }),
    upsert: (row) => {
      rows.push(row);

      return Promise.resolve('m1');
    },
    isOutOfReach: () => Promise.resolve(outOfReach),
    mayWatch: (_viewer, age) => Promise.resolve((age ?? 0) <= mayWatchUpTo),
    ageOf: () => Promise.resolve(15),
    isWatchedByOthers: () => isWatched,
    now: () => new Date(0),
  });

  return { service, rows, choose, remember, register, resolve };
};

describe('playing a film straight from a source', () => {
  it('registers the link, keeps the film named by the catalogue, and the stream it plays from', async () => {
    const { service, rows, choose, remember, register } = build();

    expect(await service.play('offer-1', asTheServer)).toEqual({ kind: 'ready', mediaId: 'm1' });
    expect(register).toHaveBeenCalledWith(expect.stringMatching(/^streamed-/), {
      url: READY.kind === 'ready' ? READY.url : '',
      hosts: ['*.files.example.test'],
      sizeBytes: 10,
    });
    expect(rows).toMatchObject([
      {
        libraryId: 'streamed-library',
        path: 'streamed://film/603',
        title: 'A Film',
        probeVersion: 7,
        probe: { subtitleStreams: [] },
        metadata: { externalId: '603', posterUrl: 'p.jpg' },
      },
    ]);
    expect(choose).toHaveBeenCalledWith(
      expect.objectContaining({ mediaItemId: 'm1', streamKey: 'a', fileName: 'film.mkv' }),
    );
    expect(remember).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ url: 'https://eu1.files.example.test/a' }),
    );
  });

  it('plays a film already playing from the same stream without asking its source again', async () => {
    const { service, resolve } = build({
      existing: 'm1',
      chosen: {
        mediaItemId: 'm1',
        pluginId: 'example-files',
        sourceId: 'files',
        streamKey: 'a',
        name: 'x',
        infoHash: null,
        fileName: null,
        sizeBytes: null,
      },
    });

    expect(await service.play('offer-1', asTheServer)).toEqual({ kind: 'ready', mediaId: 'm1' });
    expect(resolve).not.toHaveBeenCalled();
  });

  it('says a source is still preparing a film, and passes on what it refused', async () => {
    expect(
      await build({ answer: { kind: 'preparing', progress: 0.2 } }).service.play(
        'offer-1',
        asTheServer,
      ),
    ).toEqual({
      kind: 'preparing',
      progress: 0.2,
    });
    await expect(
      build({ answer: { kind: 'refused', reason: 'archive', message: null } }).service.play(
        'offer-1',
        asTheServer,
      ),
    ).rejects.toMatchObject({ problem: 'sourceArchive' });
  });

  it('refuses a file with no picture, a film above the age allowed, and an offer it no longer holds', async () => {
    await expect(
      build({ probe: { ...PROBE, video: null } }).service.play('offer-1', asTheServer),
    ).rejects.toMatchObject({
      problem: 'sourceNoFile',
    });
    await expect(
      build({ outOfReach: true }).service.play('offer-1', asTheServer),
    ).rejects.toMatchObject({
      said: { code: 'server.streamSources.createStreamService.thisFilmIsNotAvailableTo' },
    });
    expect(await build().service.play('gone', asTheServer)).toBeNull();
  });

  const ANOTHER_STREAM: StreamedChoice = {
    mediaItemId: 'm1',
    pluginId: 'example-files',
    sourceId: 'files',
    streamKey: 'another',
    name: 'x',
    infoHash: null,
    fileName: null,
    sizeBytes: null,
  };

  it('refuses a film above the viewer’s ceiling before asking its source or keeping anything', async () => {
    const { service, rows, choose, remember, resolve } = build({ mayWatchUpTo: 12 });

    await expect(service.play('offer-1', asTheServer)).rejects.toMatchObject({
      said: { code: 'server.streamSources.createStreamService.thisFilmIsAboveTheAge' },
    });
    expect(resolve).not.toHaveBeenCalled();
    expect(rows).toEqual([]);
    expect(choose).not.toHaveBeenCalled();
    expect(remember).not.toHaveBeenCalled();
  });

  it('refuses a viewer limited to a library before asking any source', async () => {
    const { service, resolve } = build({ mayWatchUpTo: -1 });

    await expect(service.play('offer-1', asTheServer)).rejects.toMatchObject({
      said: { code: 'server.streamSources.createStreamService.thisFilmIsNotAvailableTo' },
    });
    expect(resolve).not.toHaveBeenCalled();
  });

  it('refuses a kept film out of the viewer’s reach without changing its stream', async () => {
    const { service, resolve, choose } = build({
      existing: 'm1',
      chosen: ANOTHER_STREAM,
      outOfReach: true,
    });

    await expect(service.play('offer-1', asTheServer)).rejects.toMatchObject({
      said: { code: 'server.streamSources.createStreamService.thisFilmIsNotAvailableTo' },
    });
    expect(resolve).not.toHaveBeenCalled();
    expect(choose).not.toHaveBeenCalled();
  });

  it('keeps a film somebody else is watching on the stream they are watching it from', async () => {
    const { service, resolve, choose } = build({
      existing: 'm1',
      chosen: ANOTHER_STREAM,
      isWatched: true,
    });

    expect(await service.play('offer-1', asTheServer)).toEqual({ kind: 'ready', mediaId: 'm1' });
    expect(resolve).not.toHaveBeenCalled();
    expect(choose).not.toHaveBeenCalled();
  });

  it('moves a film nobody else is watching to the stream asked for', async () => {
    const { service, choose } = build({ existing: 'm1', chosen: ANOTHER_STREAM });

    expect(await service.play('offer-1', asTheServer)).toEqual({ kind: 'ready', mediaId: 'm1' });
    expect(choose).toHaveBeenCalledWith(expect.objectContaining({ streamKey: 'a' }));
  });
});
