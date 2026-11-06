import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTitleChoices } from './fetchTitleChoices';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitleChoices', () => {
  it('reads what a library’s filters can be set to', async () => {
    const fetching = vi.fn((_path: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify({ filters: [{ kind: 'genre', values: [{ value: 'Drama', count: 2 }] }] }),
        ),
      ),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(fetchTitleChoices('lib')).resolves.toMatchObject({
      filters: [{ kind: 'genre' }],
    });
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/admin/titles/choices?libraryId=lib');
  });
});
