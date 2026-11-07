import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import type { WallTitle } from './PosterWall.types';

/**
 * Where a title falls in an order that holds for one seed and changes with the next.
 *
 * @param key - The title.
 * @param seed - The seed.
 * @returns Its place.
 */
const placeFor = (key: string, seed: number): number =>
  [...key].reduce((sum, letter) => (sum * 33 + letter.charCodeAt(0)) % 2147483647, seed);

/**
 * Every film and programme on the server, each with its poster, in an order shuffled once for each
 * time the wall is opened, so it is a different wall every time and a steady one while it is open.
 *
 * @param seed - What the order is shuffled by.
 * @returns The titles, and whether they are still being read.
 */
const useWallTitles = (seed: number) => {
  const libraries = useQuery(libraryQueries.all());
  const filmLibraries = useMemo(
    () =>
      (libraries.data ?? []).filter((one) => one.kind === 'movies').map((library) => library.id),
    [libraries.data],
  );
  const showLibraries = useMemo(
    () =>
      (libraries.data ?? [])
        .filter((one) => one.kind === 'shows' || one.kind === 'anime')
        .map((library) => library.id),
    [libraries.data],
  );

  const films = useQuery(libraryQueries.everything(filmLibraries, { kind: 'films' }));
  const shows = useQueries({
    queries: showLibraries.map((id) => libraryQueries.shows(id)),
    combine: (answers) => ({
      found: answers.flatMap((answer) => answer.data ?? []),
      isPending: answers.some((answer) => answer.isPending),
    }),
  });

  const titles = useMemo(() => {
    const filmTitles: WallTitle[] = (films.data ?? [])
      .filter((film) => (film.extraKind ?? null) === null && (film.parentId ?? null) === null)
      .map((film) => ({
        key: `film:${film.id}`,
        kind: 'film',
        id: film.id,
        title: film.title,
        year: film.year,
        poster: film.hasPoster ? artworkUrl(film.id, 'poster', { size: 'small' }) : null,
      }));
    const showTitles: WallTitle[] = shows.found.map((show) => ({
      key: `show:${show.id}`,
      kind: 'show',
      id: show.id,
      title: show.title,
      year: show.year ?? null,
      poster: artworkUrl(show.coverMediaId, 'poster', { isOfTitle: true, size: 'small' }),
    }));

    return [...filmTitles, ...showTitles].toSorted(
      (one, other) => placeFor(one.key, seed) - placeFor(other.key, seed),
    );
  }, [films.data, shows.found, seed]);

  return {
    titles,
    isReading: libraries.isPending || films.isPending || shows.isPending,
  };
};

export { useWallTitles };
