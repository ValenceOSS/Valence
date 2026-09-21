import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJobRun } from './fetchJobRun';

afterEach(() => {
  vi.unstubAllGlobals();
});

const RUN = {
  id: 'run 1',
  kind: 'library.scan',
  status: 'completed',
  subject: null,
  startedAtMs: 1,
  finishedAtMs: 2,
  progress: null,
  errorMessage: null,
  createdAtMs: 1,
};

describe('fetchJobRun', () => {
  it('reads the run named, its id made safe to put in an address', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(RUN) });

    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchJobRun('run 1')).toStrictEqual(RUN);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/jobs/history/run%201');
  });

  it('has nothing where the run has been forgotten', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }),
    );

    expect(await fetchJobRun('gone')).toBeNull();
  });

  it('has nothing where the server cannot be reached or answers badly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    expect(await fetchJobRun('x')).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }),
    );

    expect(await fetchJobRun('x')).toBeNull();
  });
});
