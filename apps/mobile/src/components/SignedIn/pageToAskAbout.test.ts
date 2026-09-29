import { QueryClient } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { aCatalogueTitleDetail } from '@ValenceClient/testing/aCatalogueTitleDetail';
import { pageToAskAbout } from './pageToAskAbout';

describe('pageToAskAbout', () => {
  it('asks about what nobody has read yet, rather than waiting to find out', () => {
    expect(pageToAskAbout(new QueryClient(), 'film', '438631')).toEqual({
      kind: 'asking',
      about: 'film',
      id: '438631',
    });
  });

  it('asks about what is known not to be in the library', () => {
    const cache = new QueryClient();

    cache.setQueryData(requestsQueries.askable('film', '438631').queryKey, aCatalogueTitleDetail());

    expect(pageToAskAbout(cache, 'film', '438631')).toMatchObject({ kind: 'asking' });
  });

  it('opens what is already in the library straight away, a film as a title and a series as one', () => {
    const cache = new QueryClient();
    const inTheLibrary = (mediaId: string) =>
      aCatalogueTitleDetail({
        standing: { status: 'library', mediaId, requestId: null, requestState: null },
      });

    cache.setQueryData(requestsQueries.askable('film', '438631').queryKey, inTheLibrary('dune'));
    cache.setQueryData(
      requestsQueries.askable('series', '154524').queryKey,
      inTheLibrary('hearts'),
    );

    expect(pageToAskAbout(cache, 'film', '438631')).toEqual({ kind: 'title', mediaId: 'dune' });
    expect(pageToAskAbout(cache, 'series', '154524')).toEqual({
      kind: 'series',
      seriesId: 'hearts',
    });
  });
});
