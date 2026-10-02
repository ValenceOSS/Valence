import { afterEach, describe, expect, it, vi } from 'vitest';
import { askForArrWanted } from './askForArrWanted';

const A_WANTED = {
  key: 'film:603',
  kind: 'film' as const,
  tmdbId: 603,
  tvdbId: null,
  musicBrainzId: null,
  title: 'The Matrix',
  seasons: null,
  libraryId: null,
  profileId: null,
  isApproved: true,
  requester: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('askForArrWanted', () => {
  it('asks for what was waited for, and reads how it went', async () => {
    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(Response.json({ made: 1, already: 0, failed: [] })),
    );

    vi.stubGlobal('fetch', fetchMock);

    expect((await askForArrWanted([A_WANTED])).value).toEqual({ made: 1, already: 0, failed: [] });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/imports/arr/requests');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ items: [A_WANTED] }));
  });
});
