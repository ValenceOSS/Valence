import { afterEach, describe, expect, it, vi } from 'vitest';
import { editTitlesTogether } from './editTitlesTogether';

const TARGET = { mediaId: '00000000-0000-4000-8000-000000000001', scope: 'title' as const };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('editTitlesTogether', () => {
  it('posts to the server and reads back its answer', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(
        new Response(JSON.stringify({ changeSetId: 'set', changed: [], unchanged: 1, refused: 0 })),
      ),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(
      editTitlesTogether({ targets: [TARGET], appliesTo: 'titles', change: { lockAll: true } }),
    ).resolves.toMatchObject({ unchanged: 1 });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/admin/titles/bulk');
  });

  it('throws with the server’s words where it refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ error: 'Not now' }), { status: 409 })),
      ),
    );

    await expect(
      editTitlesTogether({ targets: [TARGET], appliesTo: 'titles', change: { lockAll: true } }),
    ).rejects.toThrow('Not now');
  });
});
