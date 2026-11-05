import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseEpisodeOrder } from './chooseEpisodeOrder';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chooseEpisodeOrder', () => {
  it('puts the order chosen for the programme', async () => {
    const fetching = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ corrected: 4, jobId: null }), { status: 200 })),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(chooseEpisodeOrder('file', 'dvd')).resolves.toMatchObject({
      kind: 'reached',
      count: 4,
    });
    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ order: 'dvd' }),
    });
  });
});
