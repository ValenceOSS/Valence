import { afterEach, describe, expect, it, vi } from 'vitest';
import { planPatternRenames } from './planPatternRenames';

const FILE = {
  mediaId: 'm1',
  from: '/a/b.mkv',
  to: '/a/B (2001)/B (2001).mkv',
  sidecars: 1,
  state: 'ready',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('planPatternRenames', () => {
  it('posts the files and reads back where each would go', async () => {
    const fetching = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ files: [FILE] }), { status: 200 })),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(planPatternRenames(['m1'])).resolves.toEqual({ files: [FILE] });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/media/rename-plan');
    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ mediaIds: ['m1'] }),
    });
  });
});
