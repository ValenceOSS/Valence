import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachOrphanedEdits } from './attachOrphanedEdits';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('attachOrphanedEdits', () => {
  it('asks the server, and reads back its answer', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(new Response(JSON.stringify({ edits: 3 }))),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(
      attachOrphanedEdits({ libraryId: 'lib', key: 'movie:1', toId: 'film' }),
    ).resolves.toEqual({ edits: 3 });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/admin/titles/orphans/attach');
  });
});
