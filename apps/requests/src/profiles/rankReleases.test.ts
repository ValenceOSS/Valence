import { describe, expect, it } from 'vitest';
import { rankReleases } from './rankReleases';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';

const FIRST = '0f8fad5b-d9cb-469f-a165-70867728950e';
const SECOND = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

/**
 * A release with anything the test cares about changed.
 */
const aRelease = (id: string, overrides: Partial<Release> = {}): Release => ({
  id,
  title: id,
  indexerId: FIRST,
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: null,
  seeders: 10,
  leechers: 1,
  grabs: null,
  publishedAt: '2026-09-01T00:00:00.000Z',
  categories: [],
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
  ...overrides,
});

/**
 * A judgement of a release.
 */
const judged = (releaseId: string, score: number, isRejected = false): Judgement => ({
  releaseId,
  parsed: {
    title: releaseId,
    year: null,
    seasons: [],
    episodes: [],
    absoluteEpisodes: [],
    airDate: null,
    isCompleteSeries: false,
    resolution: null,
    source: null,
    codec: null,
    hdr: [],
    audio: [],
    audioChannels: null,
    musicQuality: null,
    edition: null,
    group: null,
    isProper: false,
    isRepack: false,
  },
  score,
  isRejected,
  rejections: isRejected ? ['No'] : [],
  reasons: [],
});

const PRIORITIES = new Map([
  [FIRST, 1],
  [SECOND, 2],
]);

describe('rankReleases', () => {
  it('puts what may be taken first, best score first, and picks the first', () => {
    const ranked = rankReleases(
      [aRelease('refused'), aRelease('good'), aRelease('best')],
      [judged('refused', 9000, true), judged('good', 1000), judged('best', 2000)],
      PRIORITIES,
    );

    expect(ranked.releases.map((release) => release.id)).toEqual(['best', 'good', 'refused']);
    expect(ranked.judgements.map((judgement) => judgement.releaseId)).toEqual([
      'best',
      'good',
      'refused',
    ]);
    expect(ranked.pickedId).toBe('best');
  });

  it('breaks a tie by seeders, then grabs, then the newest, then the indexer asked first', () => {
    const ranked = rankReleases(
      [
        aRelease('older', { seeders: 5, publishedAt: '2026-01-01T00:00:00.000Z' }),
        aRelease('later-indexer', { seeders: 5, indexerId: SECOND }),
        aRelease('newer', { seeders: 5 }),
        aRelease('seeded', { seeders: 50 }),
        aRelease('grabbed', { protocol: 'usenet', seeders: null, grabs: 20 }),
        aRelease('unknown', { seeders: null, publishedAt: null, indexerId: 'elsewhere' }),
      ],
      ['older', 'later-indexer', 'newer', 'seeded', 'grabbed', 'unknown'].map((id) =>
        judged(id, 100),
      ),
      PRIORITIES,
    );

    expect(ranked.releases.map((release) => release.id)).toEqual([
      'seeded',
      'grabbed',
      'newer',
      'later-indexer',
      'older',
      'unknown',
    ]);
  });

  it('picks nothing where everything was refused, and leaves out what was not judged', () => {
    const ranked = rankReleases(
      [aRelease('refused'), aRelease('unjudged')],
      [judged('refused', 0, true)],
      PRIORITIES,
    );

    expect(ranked.pickedId).toBeNull();
    expect(ranked.releases).toHaveLength(1);
  });
});
