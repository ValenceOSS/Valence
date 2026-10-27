import { describe, expect, it, vi } from 'vitest';
import { SaidError } from '@ValenceI18n/SaidError';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { StreamsAsk } from '@ValenceSDK/sources/StreamsAskSchema';
import { createStreamOffers } from './createStreamOffers';

const TITLE = {
  kind: 'film',
  catalogueId: '603',
  tmdbId: '603',
  imdbId: 'tt0133093',
  title: 'A film',
  year: 1999,
} as const;

const HASH = 'a'.repeat(40);

const OTHER = 'b'.repeat(40);

const aRelease = (title: string, infoHash: string | null, seeders: number): Release => ({
  id: title,
  title,
  indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  indexerName: 'An indexer',
  protocol: infoHash === null ? 'usenet' : 'torrent',
  sizeBytes: 1000,
  seeders,
  leechers: null,
  grabs: null,
  publishedAt: null,
  categories: [],
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
});

const SOURCES = [
  { pluginId: 'example-files', sourceId: 'files', title: 'Example files' },
  { pluginId: 'slow', sourceId: 'files', title: 'Slow files' },
];

const build = (
  streams = vi.fn((ask: StreamsAsk) =>
    Promise.resolve({
      streams: [
        ...ask.candidates.map((candidate) => ({
          key: candidate.infoHash,
          name: candidate.name,
          infoHash: candidate.infoHash,
          isReady: candidate.infoHash === HASH,
          sizeBytes: candidate.sizeBytes,
          fileName: null,
        })),
        {
          key: 'own',
          name: 'Film.1999.2160p.HDR.WEB-DL',
          infoHash: null,
          isReady: true,
          sizeBytes: 9,
          fileName: null,
        },
      ],
    }),
  ),
  sources = SOURCES,
) => {
  const searchReleases = vi.fn(() =>
    Promise.resolve([
      aRelease('Film.1999.720p.BluRay', OTHER, 3),
      aRelease('Film.1999.1080p.BluRay', HASH, 9),
      aRelease('Film.1999.1080p.BluRay.copy', HASH, 2),
      aRelease('Film.1999.NZB', null, 0),
    ]),
  );
  const askSource = vi.fn((pluginId: string) => ({
    streams:
      pluginId === 'slow'
        ? () => Promise.reject(new SaidError(sayVerbatim('Slow files is down.')))
        : streams,
  }));

  return {
    offers: createStreamOffers({
      sources: () => Promise.resolve(sources),
      askSource,
      searchReleases,
    }),
    searchReleases,
    askSource,
    streams,
  };
};

describe('what can play a film straight from a source', () => {
  it('hands every source the torrents found, each once by its best seeded copy', async () => {
    const { offers, streams } = build();

    await offers.offersFor(TITLE);

    expect(streams).toHaveBeenCalledWith({
      title: TITLE,
      candidates: [
        { infoHash: HASH, name: 'Film.1999.1080p.BluRay', sizeBytes: 1000, seeders: 9 },
        { infoHash: OTHER, name: 'Film.1999.720p.BluRay', sizeBytes: 1000, seeders: 3 },
      ],
    });
  });

  it('reads each offer’s quality from its name, ready ones first, then the sharper picture', async () => {
    const found = await build().offers.offersFor(TITLE);

    expect(
      found.offers.map((offer) => [offer.name, offer.isReady, offer.resolution, offer.seeders]),
    ).toEqual([
      ['Film.1999.2160p.HDR.WEB-DL', true, '2160p', null],
      ['Film.1999.1080p.BluRay', true, '1080p', 9],
      ['Film.1999.720p.BluRay', false, '720p', 3],
    ]);
    expect(found.offers[0]).toMatchObject({
      sourceName: 'Example files',
      hdr: ['hdr10'],
      source: 'webdl',
    });
  });

  it('says which source failed, and answers with the others', async () => {
    expect((await build().offers.offersFor(TITLE)).problems).toEqual([
      sayVerbatim('Slow files is down.'),
    ]);
  });

  it('holds what each offer is under an id, and keeps a film’s offers a while', async () => {
    const { offers, searchReleases } = build(undefined, SOURCES.slice(0, 1));
    const found = await offers.offersFor(TITLE);
    const [first] = found.offers;

    expect(offers.held(first?.id ?? '')).toMatchObject({
      pluginId: 'example-files',
      sourceId: 'files',
      stream: { key: 'own' },
      title: TITLE,
    });
    expect(offers.held('nobody')).toBeNull();
    expect(await offers.offersFor(TITLE)).toBe(found);
    expect(searchReleases).toHaveBeenCalledTimes(1);
    await offers.offersFor(TITLE, true);
    expect(searchReleases).toHaveBeenCalledTimes(2);
  });

  it('keeps an answer a source could not say in for only a minute', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(0);

    const { offers, searchReleases } = build();

    await offers.offersFor(TITLE);
    await offers.offersFor(TITLE);

    expect(searchReleases).toHaveBeenCalledTimes(1);

    vi.setSystemTime(61_000);
    await offers.offersFor(TITLE);

    expect(searchReleases).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('shares a look at a film already under way', async () => {
    const { offers, searchReleases } = build();
    const [one, other] = await Promise.all([
      offers.offersFor(TITLE),
      offers.offersFor(TITLE, true),
    ]);

    expect(one).toBe(other);
    expect(searchReleases).toHaveBeenCalledTimes(1);
  });

  it('gives up on a source that does not answer in time', async () => {
    vi.useFakeTimers();

    const offers = createStreamOffers({
      sources: () => Promise.resolve([SOURCES[0] ?? { pluginId: '', sourceId: '', title: '' }]),
      askSource: () => ({ streams: () => new Promise(() => undefined) }),
      searchReleases: () => Promise.resolve([]),
      patienceMs: 1000,
    });
    const asking = offers.offersFor(TITLE);

    await vi.advanceTimersByTimeAsync(1000);
    expect(await asking).toMatchObject({
      offers: [],
      problems: [{ code: 'server.streamSources.createStreamOffers.sourceDidNotAnswerInTime' }],
    });
    vi.useRealTimers();
  });

  it('asks nobody when no plugin offers a source', async () => {
    const searchReleases = vi.fn(() => Promise.resolve([]));
    const offers = createStreamOffers({
      sources: () => Promise.resolve([]),
      askSource: () => ({ streams: () => Promise.resolve({ streams: [] }) }),
      searchReleases,
    });

    expect(await offers.offersFor(TITLE)).toEqual({ offers: [], problems: [] });
    expect(searchReleases).not.toHaveBeenCalled();
  });
});
