import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseSeasonSource } from './chooseSeasonSource';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chooseSeasonSource', () => {
  it('puts the show and season a season is read from, and follows the job reading it again', async () => {
    const fetching = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(
        new Response(JSON.stringify({ corrected: 6, jobId: 'job' }), { status: 200 }),
      ),
    );

    vi.stubGlobal('fetch', fetching);

    const source = { externalId: '900', externalSeason: 1 };

    await expect(chooseSeasonSource('file', source)).resolves.toEqual({
      kind: 'reached',
      count: 6,
      jobId: 'job',
    });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/media/file/season-source');
    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ source }),
    });
  });
});
