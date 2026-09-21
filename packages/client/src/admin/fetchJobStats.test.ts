import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJobStats } from './fetchJobStats';

afterEach(() => {
  vi.unstubAllGlobals();
});

const STATS = {
  sinceMs: 100,
  kinds: [
    {
      kind: 'library.scan',
      runs: 4,
      completed: 3,
      failed: 1,
      running: 0,
      medianMs: 900,
      slowestMs: 2000,
      lastAtMs: 50,
    },
  ],
};

describe('fetchJobStats', () => {
  it('reads how each kind of job has gone since the moment given', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(STATS) });

    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchJobStats(100)).toStrictEqual(STATS);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/jobs/stats?sinceMs=100');
  });

  it('leaves the start to the server when none is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(STATS) });

    vi.stubGlobal('fetch', fetchMock);
    await fetchJobStats();

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/jobs/stats');
  });

  it('lists no kinds where the server refuses or cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }),
    );

    expect(await fetchJobStats(5)).toStrictEqual({ sinceMs: 5, kinds: [] });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    expect((await fetchJobStats(5)).kinds).toStrictEqual([]);
  });

  it('lists no kinds where the answer is not what was promised', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ kinds: 'no' }) }),
    );

    expect((await fetchJobStats(5)).kinds).toStrictEqual([]);
  });
});
