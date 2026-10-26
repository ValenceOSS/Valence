import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { searchSayingWhy } from './searchSayingWhy';

const fetchMock = vi.fn<typeof fetch>();

const SCHEMA = z.object({ matches: z.array(z.string()) });

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('searchSayingWhy', () => {
  it('answers with what was found', async () => {
    fetchMock.mockResolvedValue(Response.json({ matches: ['Arrival'] }));

    await expect(searchSayingWhy('/api/search', SCHEMA)).resolves.toEqual(['Arrival']);
  });

  it('answers with why the server could not search, in its words', async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: 'Couldn’t reach MusicBrainz.',
          code: 'error.sources.couldNotReachSource',
          values: { source: 'MusicBrainz' },
        },
        { status: 503 },
      ),
    );

    await expect(searchSayingWhy('/api/search', SCHEMA)).resolves.toEqual({
      problem: 'Couldn’t reach MusicBrainz. Try again in a moment.',
    });
  });

  it('says it could not search where nobody said why', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(searchSayingWhy('/api/search', SCHEMA)).resolves.toEqual({
      problem: 'Couldn’t search. Try again.',
    });
  });
});
