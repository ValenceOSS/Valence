import { afterEach, describe, expect, it, vi } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { fetchTitleFiles } from './fetchTitleFiles';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitleFiles', () => {
  it('reads every file of a title through one of them', async () => {
    const file = aMediaSummary({ id: '00000000-0000-4000-8000-000000000001' });

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ files: [file], paths: { [file.id]: '/films/A.mkv' } })),
        ),
      ),
    );

    await expect(fetchTitleFiles(file.id)).resolves.toMatchObject({
      files: [{ id: file.id }],
      paths: { [file.id]: '/films/A.mkv' },
    });
  });

  it('reaches a programme by the list’s own id for it, spaces and all', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(new Response(JSON.stringify({ files: [], paths: {} }))),
    );

    vi.stubGlobal('fetch', fetching);

    await fetchTitleFiles('series lib show-1');

    expect(fetching.mock.calls[0]?.[0]).toBe('/api/admin/titles/series%20lib%20show-1');
  });
});
