import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it } from 'vitest';
import { aRelease as aSeededRelease } from '@ValenceRequests/testing/aRelease';
import { rankReleases } from './rankReleases';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';

const FIRST = '0f8fad5b-d9cb-469f-a165-70867728950e';
const SECOND = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

/**
 * A release found by the first indexer, with anything the test cares about changed.
 */
const aRelease = (id: string, overrides: Partial<Release> = {}): Release =>
  aSeededRelease(id, {
    indexerId: FIRST,
    publishedAt: '2026-09-01T00:00:00.000Z',
    categories: [],
    ...overrides,
  });

/**
 * A judgement of a release.
 */
const judged = (releaseId: string, score: number, isRejected = false, quality = 1): Judgement => ({
  releaseId,
  quality,
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
    languages: [],
    edition: null,
    group: null,
    isProper: false,
    isRepack: false,
  },
  score,
  isRejected,
  rejections: isRejected ? [sayVerbatim('No')] : [],
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

  it('breaks a tie by the indexer asked first, then seeders or grabs by band, then the newest', () => {
    const ranked = rankReleases(
      [
        aRelease('seeded', { seeders: 50 }),
        aRelease('grabbed', { protocol: 'usenet', seeders: null, grabs: 20 }),
        aRelease('older', { seeders: 5, publishedAt: '2026-01-01T00:00:00.000Z' }),
        aRelease('newer', { seeders: 6, publishedAt: '2026-02-01T00:00:00.000Z' }),
        aRelease('later-indexer', { seeders: 500, indexerId: SECOND }),
        aRelease('unknown', { seeders: null, publishedAt: null, indexerId: 'elsewhere' }),
      ],
      ['seeded', 'grabbed', 'older', 'newer', 'later-indexer', 'unknown'].map((id) =>
        judged(id, 100),
      ),
      PRIORITIES,
    );

    expect(ranked.releases.map((release) => release.id)).toEqual([
      'seeded',
      'grabbed',
      'newer',
      'older',
      'later-indexer',
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

  it('puts the better quality first, then the better score, then what fills the most', () => {
    const fills = new Map([
      [SECOND, 9],
      [FIRST, 1],
    ]);
    const better = rankReleases(
      [aRelease(FIRST), aRelease(SECOND)],
      [judged(FIRST, 0, false, 2), judged(SECOND, 50, false, 1)],
      new Map(),
      fills,
    );
    const evenly = rankReleases(
      [aRelease(FIRST), aRelease(SECOND)],
      [judged(FIRST, 10), judged(SECOND, 10)],
      new Map(),
      fills,
    );

    expect(better.pickedId).toBe(FIRST);
    expect(evenly.releases.map((release) => release.id)).toEqual([SECOND, FIRST]);
  });

  it('lets the score decide where nobody says what each fills', () => {
    const ranked = rankReleases(
      [aRelease(SECOND), aRelease(FIRST)],
      [judged(SECOND, 1000), judged(FIRST, 1100)],
      new Map(),
    );

    expect(ranked.pickedId).toBe(FIRST);
  });

  it('never lets what it fills raise a release the profile refused', () => {
    const ranked = rankReleases(
      [aRelease(SECOND), aRelease(FIRST)],
      [judged(SECOND, 1000, true), judged(FIRST, 100)],
      new Map(),
      new Map([
        [SECOND, 9],
        [FIRST, 1],
      ]),
    );

    expect(ranked.pickedId).toBe(FIRST);
  });
});
