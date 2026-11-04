import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTitleCandidates } from './fetchTitleCandidates';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitleCandidates', () => {
  it('asks for a page of what a title might be', async () => {
    const answer = { matches: [], hasMore: false, total: 0 };
    const fetched = vi.fn((_address: string) =>
      Promise.resolve(new Response(JSON.stringify(answer))),
    );

    vi.stubGlobal('fetch', fetched);

    await expect(fetchTitleCandidates('A film', 'movie', 2)).resolves.toEqual(answer);
    expect(fetched.mock.calls[0]?.[0]).toBe(
      '/api/admin/titles/candidates?query=A+film&kind=movie&page=2',
    );
  });

  it('says why where the catalogue could not be asked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ error: 'No' }), { status: 503 }))),
    );

    await expect(fetchTitleCandidates('A film', 'movie')).resolves.toHaveProperty('problem');
  });
});
