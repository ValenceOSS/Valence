import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLogHistogram } from './fetchLogHistogram';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLogHistogram', () => {
  it('asks for the bars of the records a query matches', async () => {
    const bars = {
      fromMs: 0,
      untilMs: 2000,
      bucketMs: 1000,
      buckets: [{ atMs: 0, debug: 0, info: 2, warn: 0, error: 1 }],
    };
    const fetchMock = vi
      .fn<(path: string, init: { body: string }) => Promise<object>>()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(bars) });

    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchLogHistogram({ levels: ['error'], buckets: 24 })).toStrictEqual(bars);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/logs/histogram');
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body ?? '{}')).toStrictEqual({
      levels: ['error'],
      buckets: 24,
    });
  });

  it('draws no bars where the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    expect((await fetchLogHistogram({})).buckets).toStrictEqual([]);
  });
});
