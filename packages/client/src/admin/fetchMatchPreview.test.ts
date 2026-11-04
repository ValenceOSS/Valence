import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMatchPreview } from './fetchMatchPreview';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMatchPreview', () => {
  it('asks for a title beside the entry it would be matched to', async () => {
    const answer = { kind: 'film', rows: [], posterUrl: null, backdropUrl: null };
    const fetched = vi.fn((_address: string) =>
      Promise.resolve(new Response(JSON.stringify(answer))),
    );

    vi.stubGlobal('fetch', fetched);

    await expect(fetchMatchPreview('film', '604', 'movie')).resolves.toEqual(answer);
    expect(fetched.mock.calls[0]?.[0]).toBe(
      '/api/media/film/match/preview?externalId=604&kind=movie',
    );
  });
});
