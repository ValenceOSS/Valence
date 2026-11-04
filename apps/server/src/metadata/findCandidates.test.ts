import { describe, expect, it, vi } from 'vitest';
import { findCandidates } from './findCandidates';
import type { CandidateSources } from './findCandidates';
import type { CatalogueMatch } from '@ValenceServer/library/MetadataProvider';

const A_MATCH: CatalogueMatch = {
  externalId: '1',
  kind: 'movie',
  title: 'Found by name',
  year: 2001,
  overview: null,
  posterUrl: null,
};

/**
 * Sources that find one entry by any name, and describe any id.
 *
 * @param found - What a search by name finds, by the words searched.
 * @returns The sources, spied on.
 */
const sourcesFinding = (found: (words: string) => CatalogueMatch[] = () => [A_MATCH]) => {
  const sources = {
    searchPages: vi.fn<CandidateSources['searchPages']>(({ query }) =>
      Promise.resolve({ matches: found(query), hasMore: true, total: 134 }),
    ),
    describeTitle: vi.fn<CandidateSources['describeTitle']>(() =>
      Promise.resolve({
        title: 'Found by id',
        year: 1999,
        overview: null,
        posterUrl: null,
        backdropUrl: null,
        genres: [],
        runtimeMinutes: null,
        cast: [],
        trailerKey: null,
      }),
    ),
    findByImdbId: vi.fn<CandidateSources['findByImdbId']>(() => Promise.resolve('603')),
  };

  return sources;
};

describe('findCandidates', () => {
  it('searches by name a page at a time, saying how many there are', async () => {
    const sources = sourcesFinding();

    await expect(
      findCandidates({ query: 'A film', kind: 'movie', page: 2 }, sources),
    ).resolves.toEqual({ matches: [A_MATCH], hasMore: true, total: 134 });
    expect(sources.searchPages).toHaveBeenCalledWith({ query: 'A film', kind: 'movie', page: 2 });
  });

  it('opens on the entry a pasted TMDB address or IMDb id names, alone', async () => {
    const sources = sourcesFinding();
    const fromAddress = await findCandidates(
      { query: 'https://www.themoviedb.org/tv/1399-a-show', kind: 'movie', page: 1 },
      sources,
    );
    const fromImdb = await findCandidates({ query: 'tt0133093', kind: 'movie', page: 1 }, sources);

    expect(fromAddress.matches).toMatchObject([{ externalId: '1399', kind: 'tv' }]);
    expect(fromImdb.matches).toMatchObject([{ externalId: '603', title: 'Found by id' }]);
    expect(sources.searchPages).not.toHaveBeenCalled();
  });

  it('puts the entry a bare number names first, ahead of titles named by that number', async () => {
    const sources = sourcesFinding();
    const found = await findCandidates({ query: '1917', kind: 'movie', page: 1 }, sources);

    expect(found.matches.map((match) => match.title)).toEqual(['Found by id', 'Found by name']);
    expect(found.total).toBe(135);
  });

  it('takes "&" and "and" as the same where the name as written finds nothing', async () => {
    const sources = sourcesFinding((words) => (words === 'Law and Order' ? [A_MATCH] : []));

    await expect(
      findCandidates({ query: 'Law & Order', kind: 'tv', page: 1 }, sources),
    ).resolves.toMatchObject({ matches: [A_MATCH] });
  });
});
