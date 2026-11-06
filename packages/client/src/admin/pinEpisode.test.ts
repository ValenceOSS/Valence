import { afterEach, describe, expect, it, vi } from 'vitest';
import { pinEpisode } from './pinEpisode';

const answering = (body: object) => {
  const fetching = vi.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(body), { status: 200 })),
  );

  vi.stubGlobal('fetch', fetching);

  return fetching;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pinEpisode', () => {
  it('puts the episode a file is, and follows the job reading it again', async () => {
    const fetching = answering({ corrected: 1, jobId: 'job' });
    const pin = { seasonNumber: 1, episodeNumber: 2, episodeNumberEnd: 3 };

    await expect(pinEpisode('file', pin)).resolves.toEqual({
      kind: 'reached',
      count: 1,
      jobId: 'job',
    });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/media/file/episode-pin');
    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ pin }),
    });
  });
});
