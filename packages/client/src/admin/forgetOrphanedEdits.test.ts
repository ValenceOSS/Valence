import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetOrphanedEdits } from './forgetOrphanedEdits';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('forgetOrphanedEdits', () => {
  it('asks the server, and reads back its answer', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(new Response(JSON.stringify({ edits: 2 }))),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(forgetOrphanedEdits({ libraryId: 'lib', key: 'movie:1' })).resolves.toEqual({
      edits: 2,
    });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/admin/titles/orphans/forget');
  });
});
