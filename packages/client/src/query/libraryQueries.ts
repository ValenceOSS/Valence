import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  fetchLibraries,
  fetchLibraryItems,
  fetchMediaDetail,
} from '@ValenceClient/library/fetchLibrary';
import { fetchComingUp, fetchShows, fetchShow } from '@ValenceClient/library/fetchShows';
import { readEveryItem } from '@ValenceClient/library/readEveryItem';
import { rankBySearch } from '@ValenceClient/library/rankBySearch';
import { fetchFacets } from '@ValenceClient/library/fetchFacets';
import { fetchLeftOut } from '@ValenceClient/library/fetchLeftOut';
import { fetchPerson, fetchPersonCredits } from '@ValenceClient/library/fetchPerson';
import { findPeople } from '@ValenceClient/library/findPeople';
import { fetchLikeThis } from '@ValenceClient/library/fetchLikeThis';
import type { ListItemsOptions } from '@ValenceClient/library/fetchLibrary';
import { readEachLibrary } from '@ValenceClient/query/readEachLibrary';

const LIBRARY = ['library'] as const;

/**
 * The libraries this server holds.
 *
 * @returns The query.
 */
const all = () =>
  queryOptions({
    queryKey: [...LIBRARY, 'all'],
    queryFn: () => fetchLibraries(),
  });

/**
 * A page of one library, for whatever question is being asked of it.
 *
 * The options are the key, so two screens asking the same question share one answer and a screen
 * asking a different one does not overwrite it. Searching does not throw away the unsearched page,
 * which is what makes clearing a search instant.
 *
 * The answer carries the library it came from, because the last one stays on screen while the next
 * is being fetched, and a page reporting itself empty has to name the library it is empty of rather
 * than the library that has only just been asked for.
 *
 * @param libraryId - Which library, or null where none has been chosen yet.
 * @param options - What is being asked of it.
 * @returns The query.
 */
const items = (libraryId: string | null, options: ListItemsOptions = {}) =>
  queryOptions({
    queryKey: [...LIBRARY, 'items', libraryId, options],
    queryFn: async () => ({ ...(await fetchLibraryItems(libraryId ?? '', options)), libraryId }),
    enabled: libraryId !== null,
    placeholderData: keepPreviousData,
  });

/**
 * Everything about one item, which is what a dialog and a hover card both want.
 *
 * @param mediaId - The item, or null where nothing is being looked at.
 * @returns The query.
 */
const detail = (mediaId: string | null) =>
  queryOptions({
    queryKey: [...LIBRARY, 'detail', mediaId],
    queryFn: () => fetchMediaDetail(mediaId ?? ''),
    enabled: mediaId !== null,
  });

/**
 * The films and programmes in the libraries most like one.
 *
 * @param mediaId - The film, or any episode of the programme, or null where nothing is being looked at.
 * @param isWanted - Whether to ask, which waits on the server saying it can answer.
 * @returns The query.
 */
const likeThis = (mediaId: string | null, isWanted: boolean) =>
  queryOptions({
    queryKey: [...LIBRARY, 'like-this', mediaId],
    queryFn: () => fetchLikeThis(mediaId ?? ''),
    enabled: mediaId !== null && isWanted,
  });

/**
 * The programmes in a library, grouped from their episodes.
 *
 * @param libraryId - Which library, or null where none has been chosen yet.
 * @returns The query.
 */
const shows = (libraryId: string | null) =>
  queryOptions({
    queryKey: [...LIBRARY, 'shows', libraryId],
    queryFn: () => fetchShows(libraryId ?? ''),
    enabled: libraryId !== null,
  });

/**
 * One programme, with its seasons.
 *
 * @param libraryId - Which library it is in.
 * @param showId - Which programme, or null where none is open.
 * @returns The query.
 */
const show = (libraryId: string | null, showId: string | null) =>
  queryOptions({
    queryKey: [...LIBRARY, 'show', libraryId, showId],
    queryFn: () => fetchShow(libraryId ?? '', showId ?? ''),
    enabled: libraryId !== null && showId !== null,
  });

/**
 * The programmes with an episode still to air, soonest first. Kept for ten minutes, since what is
 * coming up changes by the day and the catalogue behind it is read only every few hours.
 *
 * @returns The query.
 */
const comingUp = () =>
  queryOptions({
    queryKey: [...LIBRARY, 'coming-up'],
    queryFn: () => fetchComingUp(),
    staleTime: 10 * 60 * 1000,
  });

/**
 * What a library can be filtered by — its genres, its years, its ratings.
 *
 * @returns The query.
 */
const facets = () =>
  queryOptions({
    queryKey: [...LIBRARY, 'facets'],
    queryFn: () => fetchFacets(),
  });

/**
 * Somebody in the cast or crew.
 *
 * @param personId - Who, or null where nobody is open.
 * @returns The query.
 */
const person = (personId: number | null) =>
  queryOptions({
    queryKey: [...LIBRARY, 'person', personId],
    queryFn: () => fetchPerson(personId ?? 0),
    enabled: personId !== null,
  });

/**
 * The people in what the server holds whose names match a search.
 *
 * @param search - What was typed.
 * @returns The query.
 */
const people = (search: string) =>
  queryOptions({
    queryKey: [...LIBRARY, 'people', search.trim()],
    queryFn: () => findPeople(search),
    enabled: search.trim() !== '',
  });

/**
 * What of theirs is here.
 *
 * @param personId - Who, or null where nobody is open.
 * @returns The query.
 */
const credits = (personId: number | null) =>
  queryOptions({
    queryKey: [...LIBRARY, 'credits', personId],
    queryFn: () => fetchPersonCredits(personId ?? 0),
    enabled: personId !== null,
  });

/**
 * The same question asked of every library at once, which is what a page showing the whole server
 * rather than one folder of it wants — the films page, the newest page, and the hero.
 *
 * One query rather than one per library, because these pages want a single answer: a grid that
 * renders when three of five libraries have replied is a grid that reorders itself while somebody
 * is reading it. A library that fails answers with nothing rather than failing the whole page, but
 * every library failing fails it, so a server that cannot be read is not shown as an empty one. A
 * search is ranked across every library at once, so the best answer leads wherever it was found.
 *
 * @param libraryIds - The libraries to ask.
 * @param options - What is being asked of each.
 * @returns The query.
 */
const across = (libraryIds: readonly string[], options: ListItemsOptions = {}) =>
  queryOptions({
    queryKey: [...LIBRARY, 'across', [...libraryIds].sort(), options],
    queryFn: async () => {
      const found = await readEachLibrary(libraryIds, async (libraryId) =>
        fetchLibraryItems(libraryId, options).then((page) => page.items),
      );

      return options.search === undefined || options.search.trim() === ''
        ? found
        : rankBySearch(found, options.search);
    },
    enabled: libraryIds.length > 0,
  });

/**
 * Everything that matches a question in every library at once, however many that is, for the pages
 * that list a whole library rather than a taste of it.
 *
 * Asked as one query for the same reason as `across`, and answering with nothing for a library that
 * fails, and failing where every library does, for the same reasons too.
 *
 * @param libraryIds - The libraries to ask.
 * @param options - What is being asked of each, without a limit, since a limit is what this is for
 *   not having.
 * @returns The query.
 */
const everything = (
  libraryIds: readonly string[],
  options: Omit<ListItemsOptions, 'limit' | 'offset'> = {},
) =>
  queryOptions({
    queryKey: [...LIBRARY, 'everything', [...libraryIds].sort(), options],
    queryFn: async () => {
      return readEachLibrary(libraryIds, async (libraryId) => readEveryItem(libraryId, options));
    },
    enabled: libraryIds.length > 0,
  });

/**
 * The files and folders left out of a library's scans.
 *
 * @param libraryId - The library.
 * @returns The query.
 */
const leftOut = (libraryId: string) =>
  queryOptions({
    queryKey: [...LIBRARY, libraryId, 'left-out'],
    queryFn: () => fetchLeftOut(libraryId),
  });

const libraryQueries = {
  all,
  items,
  detail,
  likeThis,
  shows,
  show,
  everything,
  comingUp,
  facets,
  person,
  people,
  credits,
  across,
  leftOut,
  key: LIBRARY,
};

export { libraryQueries };
