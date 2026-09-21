import { describe, expect, it } from 'vitest';
import { defaultLogView } from './defaultLogView';
import { logFacetsQueryFor, logHistogramQueryFor, logQueryFor } from './logQueryFor';

const NOW = 100_000_000;

describe('logQueryFor', () => {
  it('asks for the last day, every level, newest first, by default', () => {
    expect(logQueryFor(defaultLogView(), NOW)).toStrictEqual({
      levels: ['debug', 'info', 'warn', 'error'],
      sources: [],
      search: '',
      sinceMs: NOW - 86_400_000,
      untilMs: null,
      jobId: null,
      jobKinds: [],
      libraryId: null,
      mediaId: null,
      sessionId: null,
      requestId: null,
      sort: 'newest',
      offset: 0,
      limit: 200,
    });
  });

  it('asks for everything kept when the range has no start', () => {
    expect(logQueryFor({ ...defaultLogView(), range: 'all' }, NOW).sinceMs).toBeNull();
  });

  it('lets a zoom take over from the range', () => {
    const asked = logQueryFor({ ...defaultLogView(), zoom: { fromMs: 5000, untilMs: 9000 } }, NOW);

    expect(asked.sinceMs).toBe(5000);
    expect(asked.untilMs).toBe(9000);
  });

  it('carries the filters, the identifiers, the search, the order and the length', () => {
    const asked = logQueryFor(
      {
        ...defaultLogView(),
        levels: ['error'],
        sources: ['jobs'],
        jobKinds: ['library.scan'],
        ids: { jobId: 'j', libraryId: 'l', mediaId: 'm', sessionId: 's', requestId: 'r' },
        search: 'unreadable',
        sort: 'oldest',
        limit: 400,
      },
      NOW,
    );

    expect(asked).toMatchObject({
      levels: ['error'],
      sources: ['jobs'],
      jobKinds: ['library.scan'],
      jobId: 'j',
      libraryId: 'l',
      mediaId: 'm',
      sessionId: 's',
      requestId: 'r',
      search: 'unreadable',
      sort: 'oldest',
      limit: 400,
    });
  });
});

describe('logHistogramQueryFor', () => {
  it('counts the same records over the same time, with no order or page', () => {
    const view = { ...defaultLogView(), levels: ['error' as const], ids: { jobId: 'j' } };
    const { sort, offset, limit, ...rest } = logQueryFor(view, NOW);
    const counted = logHistogramQueryFor(view, NOW);

    expect([sort, offset, limit]).toStrictEqual(['newest', 0, 200]);
    expect(counted).toStrictEqual({ ...rest, buckets: 48 });
    expect(counted).not.toHaveProperty('sort');
    expect(counted).not.toHaveProperty('limit');
  });
});

describe('logFacetsQueryFor', () => {
  it('ranks the same records, with no bars to count them into', () => {
    expect(logFacetsQueryFor(defaultLogView(), NOW)).not.toHaveProperty('buckets');
    expect(logFacetsQueryFor(defaultLogView(), NOW).sinceMs).toBe(NOW - 86_400_000);
  });
});
