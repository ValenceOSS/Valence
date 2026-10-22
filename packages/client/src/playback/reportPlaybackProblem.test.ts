import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportPlaybackProblem } from './reportPlaybackProblem';

const report = {
  problem: 'damaged' as const,
  mediaId: 'media-1',
  sessionId: 'abc',
  positionSeconds: 12,
  details: 'Error 101: This file is damaged',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reportPlaybackProblem', () => {
  it('tells the server what stopped playing, naming the device', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));

    vi.stubGlobal('fetch', fetchMock);
    await reportPlaybackProblem(report, 'tab 1');

    expect(fetchMock).toHaveBeenCalledWith('/api/playback/problems?clientId=tab%201', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(report),
    });
  });

  it('lets a report go where the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    await expect(reportPlaybackProblem(report, 'tab-1')).resolves.toBeUndefined();
  });
});
