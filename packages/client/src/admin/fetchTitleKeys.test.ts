import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTitleKeys } from './fetchTitleKeys';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitleKeys', () => {
  it('names every title a listing asks for', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify({ titles: [{ id: 'a', leadId: 'a', kind: 'film', name: 'A' }] }),
        ),
      ),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(
      fetchTitleKeys({
        libraryId: 'lib',
        sort: 'title',
        isDescending: false,
        search: '',
        show: 'look',
        filters: [],
      }),
    ).resolves.toEqual({ titles: [{ id: 'a', leadId: 'a', kind: 'film', name: 'A' }] });
    expect(fetching.mock.calls[0]?.[0]).toContain('/api/admin/titles/keys?');
    expect(fetching.mock.calls[0]?.[0]).toContain('show=look');
  });
});
