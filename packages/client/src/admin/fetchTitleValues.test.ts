import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTitleValues } from './fetchTitleValues';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitleValues', () => {
  it('asks for the words in use in a field, in one library or all of them', async () => {
    const answer = { values: [{ value: 'Drama', count: 3 }] };
    const fetched = vi.fn((_address: string) =>
      Promise.resolve(new Response(JSON.stringify(answer))),
    );

    vi.stubGlobal('fetch', fetched);

    await expect(fetchTitleValues('genres', 'lib')).resolves.toEqual(answer);
    await fetchTitleValues('tags');
    expect(fetched.mock.calls.map((call) => call[0])).toEqual([
      '/api/admin/titles/values?field=genres&libraryId=lib',
      '/api/admin/titles/values?field=tags',
    ]);
  });
});
