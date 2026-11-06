import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTitlePage } from './fetchTitlePage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitlePage', () => {
  it('reads a page of the titles a listing asks for, from where the last stopped', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            titles: [],
            next: null,
            total: 0,
            counts: { all: 0, look: 0, twice: 0, unreadable: 0, edited: 0 },
          }),
        ),
      ),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(
      fetchTitlePage(
        {
          libraryId: 'lib',
          sort: 'title',
          isDescending: false,
          search: '',
          show: 'all',
          filters: [],
        },
        'cursor',
      ),
    ).resolves.toMatchObject({ total: 0 });
    expect(fetching.mock.calls[0]?.[0]).toContain('/api/admin/titles?libraryId=lib');
    expect(fetching.mock.calls[0]?.[0]).toContain('after=cursor');
  });
});
