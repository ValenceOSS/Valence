import { afterEach, describe, expect, it, vi } from 'vitest';
import { undoTitlesTogether } from './undoTitlesTogether';

const TARGET = { mediaId: '00000000-0000-4000-8000-000000000001', scope: 'title' as const };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('undoTitlesTogether', () => {
  it('posts to the server and reads back its answer', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(new Response(JSON.stringify({ changeSetId: 'undo', undone: 1 }))),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(
      undoTitlesTogether({
        changeSetId: '00000000-0000-4000-8000-000000000009',
        targets: [TARGET],
      }),
    ).resolves.toEqual({ changeSetId: 'undo', undone: 1 });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/admin/titles/bulk/undo');
  });

  it('throws with the server’s words where it refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ error: 'Not now' }), { status: 409 })),
      ),
    );

    await expect(
      undoTitlesTogether({
        changeSetId: '00000000-0000-4000-8000-000000000009',
        targets: [TARGET],
      }),
    ).rejects.toThrow('Not now');
  });
});
