import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type DiscoverFound = {
  films: CatalogueTitle[];
  shows: CatalogueTitle[];
  artists: CatalogueTitle[];
  books: CatalogueTitle[];
  count: number;
  isPending: boolean;
};

/**
 * What the catalogues have for some words that is not in the library: films, shows, artists and
 * books, each only where a library takes requests for it and whoever is searching may ask for it.
 * Nothing is asked while the words are empty.
 *
 * @param query - The words.
 * @returns What was found, by kind, how much, and whether any of it is still being looked for.
 */
const useDiscoverSearch = (query: string): DiscoverFound => {
  const { may } = useWhatIMayDo();
  const kinds = useRequestableKinds();
  const mayAsk = (kind: MediaRequestKind) =>
    kinds.has(kind) &&
    (kind === 'artist' || kind === 'album' ? may('requests.askMusic') : may('requests.ask'));
  const films = useQuery(requestsQueries.askableSearch(query, 'film', mayAsk('film')));
  const shows = useQuery(requestsQueries.askableSearch(query, 'series', mayAsk('series')));
  const artists = useQuery(requestsQueries.askableSearch(query, 'artist', mayAsk('artist')));
  const books = useQuery(requestsQueries.askableSearch(query, 'book', mayAsk('book')));
  const notHere = (titles: CatalogueTitle[] | undefined) =>
    (titles ?? []).filter((title) => title.standing.status !== 'library');
  const found = {
    films: notHere(films.data),
    shows: notHere(shows.data),
    artists: notHere(artists.data),
    books: notHere(books.data),
  };

  return {
    ...found,
    count: found.films.length + found.shows.length + found.artists.length + found.books.length,
    isPending: [films, shows, artists, books].some((one) => one.isLoading),
  };
};

export type { DiscoverFound };

export { useDiscoverSearch };
