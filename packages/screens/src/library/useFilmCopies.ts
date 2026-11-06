import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const MOST_ASKED = 20;

type FilmCopy = {
  media: MediaSummary;
  server: string | null;
};

/**
 * Every copy of a film the libraries hold — this server's own and each linked server's — so whoever
 * is watching can choose which to play it from: the same catalogue id, or the same title and year
 * where it has none. This server's comes first.
 *
 * @param film - The film open, or nothing.
 * @returns Its copies, the one open among them, each with the server it is on (nothing for this
 *   one).
 */
const useFilmCopies = (film: MediaSummary | null): FilmCopy[] => {
  const originOf = useOriginOf();
  const libraries = useQuery(libraryQueries.all());
  const filmLibraries = (libraries.data ?? [])
    .filter((library) => library.kind === 'movies')
    .map((library) => library.id);
  const isFilm = film !== null && film.seriesId === null && (film.seriesTitle ?? null) === null;
  const found = useQuery({
    ...libraryQueries.across(filmLibraries, {
      search: film?.title ?? '',
      kind: 'films',
      limit: MOST_ASKED,
    }),
    enabled: isFilm && filmLibraries.length > 0,
  });

  if (film === null || !isFilm) {
    return [];
  }

  const isSame = (one: MediaSummary) =>
    one.id === film.id ||
    ((film.externalId ?? null) !== null
      ? one.externalId === film.externalId
      : one.title === film.title && one.year === film.year);
  const copies = (found.data ?? []).filter(isSame);

  return (copies.some((one) => one.id === film.id) ? copies : [film, ...copies])
    .filter((one, at, every) => every.findIndex((other) => other.id === one.id) === at)
    .map((one) => ({ media: one, server: originOf(one.libraryId)?.name ?? null }))
    .toSorted((one, other) => Number(one.server !== null) - Number(other.server !== null));
};

export type { FilmCopy };

export { useFilmCopies };
