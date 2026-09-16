import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchResourceHistory } from './fetchResourceHistory';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

type FetchLike = (input: string, init?: RequestInit) => Promise<Answer>;

const fetchMock = vi.fn<FetchLike>();

const SAMPLE = {
  id: 'sample-1',
  atMs: 1000,
  systemCpuPercent: 12,
  loadAverage: 1.2,
  systemMemoryUsedBytes: 2048,
  systemMemoryTotalBytes: 4096,
  cpuCount: 4,
};

const answerWith = (body: JsonValue, ok = true) => {
  fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 403, json: () => Promise.resolve(body) });
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchResourceHistory', () => {
  it('reads the samples across the range asked for', async () => {
    answerWith({ records: [SAMPLE] });

    await expect(fetchResourceHistory('24h')).resolves.toEqual([SAMPLE]);
  });

  it('asks the server for the range by name', async () => {
    answerWith({ records: [] });

    await fetchResourceHistory('7d');

    expect(fetchMock.mock.calls[0]?.[0]).toContain('range=7d');
  });

  it('reads no history rather than throwing where none has been kept yet', async () => {
    answerWith({ records: [] });

    await expect(fetchResourceHistory('3d')).resolves.toEqual([]);
  });

  it('says so when the answer is not the shape it was promised', async () => {
    answerWith({}, false);

    await expect(fetchResourceHistory('24h')).rejects.toThrow();
  });

  it('says so when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(fetchResourceHistory('24h')).rejects.toThrow();
  });
});
