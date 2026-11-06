import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOrphanedEdits } from './fetchOrphanedEdits';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchOrphanedEdits', () => {
  it('asks the server, and reads back its answer', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(new Response(JSON.stringify({ orphans: [] }))),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(fetchOrphanedEdits('lib')).resolves.toEqual({ orphans: [] });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/admin/titles/orphans?libraryId=lib');
  });
});
