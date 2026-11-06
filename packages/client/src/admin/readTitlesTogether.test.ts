import { afterEach, describe, expect, it, vi } from 'vitest';
import { readTitlesTogether } from './readTitlesTogether';

const TARGET = { mediaId: '00000000-0000-4000-8000-000000000001', scope: 'title' as const };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readTitlesTogether', () => {
  it('posts to the server and reads back its answer', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(new Response(JSON.stringify({ titles: 2, fields: {} }))),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(readTitlesTogether({ targets: [TARGET], appliesTo: 'titles' })).resolves.toEqual({
      titles: 2,
      fields: {},
    });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/admin/titles/bulk/read');
  });

  it('throws with the server’s words where it refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ error: 'Not now' }), { status: 409 })),
      ),
    );

    await expect(readTitlesTogether({ targets: [TARGET], appliesTo: 'titles' })).rejects.toThrow(
      'Not now',
    );
  });
});
