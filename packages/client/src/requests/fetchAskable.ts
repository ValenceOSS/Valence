import { z } from 'zod';
import { BookAboutSchema } from '@ValenceContracts/schemas/BookAbout';
import type { BookAbout } from '@ValenceContracts/schemas/BookAbout';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import {
  CatalogueDiscoverySchema,
  CatalogueGenreSchema,
  CataloguePageSchema,
  PersonWorkSchema,
  SimilarTitlesSchema,
  CatalogueTitleDetailSchema,
  CatalogueTitleSchema,
  RequestProgressSchema,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type {
  CatalogueBrowse,
  CatalogueDiscovery,
  CatalogueFilters,
  CatalogueGenre,
  CataloguePage,
  PersonWork,
  SimilarTitles,
  CatalogueSearch,
  CatalogueTitle,
  CatalogueTitleDetail,
  RequestProgress,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import { MissingAlbumsSchema } from '@ValenceContracts/schemas/MissingAlbums';
import type { MissingAlbums } from '@ValenceContracts/schemas/MissingAlbums';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import { say } from '@ValenceI18n/say';

/**
 * Reads the shelves of things to ask for: what is trending, popular and coming, each saying
 * whether it is here already, asked for, or there to be asked for, and the studios to browse by.
 *
 * @returns The shelves and the studios.
 */
const fetchDiscover = (): Promise<CatalogueDiscovery> =>
  readFromServer('/api/requests/discover', CatalogueDiscoverySchema);

/**
 * Reads a page of a whole list of films or series to ask for, rather than the shelf's worth of it.
 *
 * @param browsing - Which list, of which kind, and whose studio where one was chosen.
 * @param page - Which page, counting from one.
 * @param filters - What to narrow it by: a genre, a span of years, a least rating.
 * @returns The page, each title saying where it stands, and whether there is more after it.
 */
const fetchCatalogueBrowse = (
  browsing: CatalogueBrowse,
  page: number,
  filters: CatalogueFilters = {},
): Promise<CataloguePage> =>
  readFromServer(
    `/api/requests/catalogue/browse?${new URLSearchParams({
      kind: browsing.kind,
      list: browsing.list,
      ...(browsing.studio === null ? {} : { studio: browsing.studio }),
      ...(filters.genre === undefined ? {} : { genre: filters.genre }),
      ...(filters.yearFrom === undefined ? {} : { yearFrom: filters.yearFrom.toString() }),
      ...(filters.yearTo === undefined ? {} : { yearTo: filters.yearTo.toString() }),
      ...(filters.minRating === undefined ? {} : { minRating: filters.minRating.toString() }),
      page: page.toString(),
    }).toString()}`,
    CataloguePageSchema,
  );

/**
 * Reads what the catalogue recommends after a title, whether or not this server holds it.
 *
 * @param kind - Whether the title is a film or a series.
 * @param id - The catalogue's identifier for it.
 * @returns The titles most like it, each saying where it stands.
 */
const fetchSimilarTitles = (kind: 'film' | 'series', id: string): Promise<SimilarTitles> =>
  readFromServer(
    `/api/requests/catalogue/similar/${kind}/${encodeURIComponent(id)}`,
    SimilarTitlesSchema,
  );

/**
 * Reads what Open Library knows of a book this server may hold: what it is about, how long it is,
 * how readers rated it, who wrote it, and the books by them and like it, each saying where it
 * stands.
 *
 * @param title - The book's title.
 * @param author - Who wrote it, where that is known.
 * @returns What is known, or null where Open Library does not know the book.
 */
const fetchBookAbout = (title: string, author: string | null): Promise<BookAbout | null> =>
  readFromServer(
    `/api/requests/catalogue/book-about?${new URLSearchParams({
      title,
      ...(author === null ? {} : { author }),
    }).toString()}`,
    BookAboutSchema.nullable(),
  );

/**
 * Reads what the catalogue credits somebody with, whether or not this server holds it.
 *
 * @param personId - The catalogue's identifier for them.
 * @returns Their films and series, most popular first, each saying where it stands.
 */
const fetchPersonWork = (personId: number): Promise<PersonWork> =>
  readFromServer(`/api/requests/catalogue/person/${personId.toString()}`, PersonWorkSchema);

/**
 * Reads a page of the films or series a search finds to ask for, past the shelf's worth of them,
 * leaving out what the library has, since a search shows that above what it finds to ask for.
 *
 * @param searching - The words, and which kind.
 * @param page - Which page, counting from one.
 * @returns The page, and whether there is more after it.
 */
const fetchCatalogueSearch = async (
  searching: CatalogueSearch,
  page: number,
): Promise<CataloguePage> => {
  const read = await readFromServer(
    `/api/requests/catalogue/search/pages?${new URLSearchParams({
      query: searching.query,
      kind: searching.kind,
      page: page.toString(),
    }).toString()}`,
    CataloguePageSchema,
  );

  return { ...read, titles: read.titles.filter((title) => title.standing.status !== 'library') };
};

/**
 * Reads the genres a list of films or series can be narrowed to.
 *
 * @param kind - Whether it is films or series.
 * @returns Each genre, by the id to narrow with and the name to show.
 */
const fetchCatalogueGenres = (kind: CatalogueBrowse['kind']): Promise<CatalogueGenre[]> =>
  readFromServer(
    `/api/requests/catalogue/genres?${new URLSearchParams({ kind }).toString()}`,
    z.array(CatalogueGenreSchema),
  );

/**
 * Searches the catalogue for films, series, artists or albums to ask for.
 *
 * @param query - What was typed.
 * @param kind - Which kind is looked for.
 * @returns What was found, each saying where it stands.
 */
const searchAskable = (query: string, kind: MediaRequestKind): Promise<CatalogueTitle[]> =>
  readFromServer(
    `/api/requests/catalogue/search?${new URLSearchParams({ query, kind }).toString()}`,
    z.array(CatalogueTitleSchema),
  );

/**
 * Reads everything a title's page shows of something that can be asked for.
 *
 * @param kind - What kind of title it is.
 * @param id - The id it was listed under.
 * @returns The title.
 */
const fetchAskable = (kind: MediaRequestKind, id: string): Promise<CatalogueTitleDetail> =>
  readFromServer(
    `/api/requests/catalogue/title/${kind}/${encodeURIComponent(id)}`,
    CatalogueTitleDetailSchema,
  );

/**
 * Reads how the downloads your own requests are waiting on are going.
 *
 * @returns Each of them, how far it has got and how long is left.
 */
const fetchRequestProgress = (): Promise<RequestProgress[]> =>
  readFromServer('/api/requests/progress', z.array(RequestProgressSchema));

/**
 * Starts finding the albums of a playlist's missing songs, or joins the search under way, and says
 * how far it has got.
 *
 * @param playlistId - The playlist.
 * @returns Each album, found, not found, or still being looked for.
 */
const findMissingAlbums = async (playlistId: string): Promise<MissingAlbums> => {
  const sent = await sendToRequests(
    `/api/requests/missing-albums/${encodeURIComponent(playlistId)}`,
    'POST',
    undefined,
    async (response) => MissingAlbumsSchema.parse(await response.json()),
  );

  if (sent.value === null) {
    throw new Error(sent.refusal?.message ?? say('common.theServerCouldNotBeReached'));
  }

  return sent.value;
};

export {
  fetchAskable,
  fetchCatalogueBrowse,
  fetchPersonWork,
  fetchSimilarTitles,
  fetchCatalogueGenres,
  fetchCatalogueSearch,
  fetchBookAbout,
  fetchDiscover,
  fetchRequestProgress,
  findMissingAlbums,
  searchAskable,
};
