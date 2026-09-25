import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { buildFilterOptions } from '@ValenceClient/library/buildFilterOptions';
import type { LibraryFacets } from '@ValenceContracts/schemas/Library';
import type { FilterGroup } from '@ValenceClient/library/FilterGroup';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const NO_FACETS: LibraryFacets = { genres: [], decades: [], maxRating: 0 };

const DECADE = 10;

const GROUPS = [
  { name: 'client.useLibraryFilters.genre', prefix: 'genre:' },
  { name: 'client.useLibraryFilters.decade', prefix: 'decade:' },
  { name: 'client.useLibraryFilters.rating', prefix: 'rating:' },
  { name: 'client.useLibraryFilters.yourRating', prefix: 'yours:' },
] as const satisfies readonly { name: StringKey; prefix: string }[];

/**
 * What somebody has narrowed a page of the library by — genre, decade, rating and their own rating
 * — and the choices the libraries actually offer for each, so nobody is offered a filter that would
 * only lead to an empty page. Returns them in the shape a filter menu and its applied chips take,
 * and as the question to put to the libraries.
 *
 * The genre can be held by the caller, where it lives in the address; the rest are held here. The
 * question is the same object for as long as the choices are, so it can be a dependency.
 *
 * @param held - The genre and the way to change it, where the caller keeps it.
 * @returns The choices, what is chosen, how to change or clear it, and it as a query.
 */
const useLibraryFilters = (held?: {
  genre: string | null;
  onGenreChange: (genre: string | null) => void;
}): {
  groups: FilterGroup[];
  selected: ReadonlySet<string>;
  change: (next: ReadonlySet<string>) => void;
  clear: () => void;
  asked: {
    genre?: string;
    yearFrom?: number;
    yearTo?: number;
    minRating?: number;
    minYourStars?: number;
  };
} => {
  const [ownGenre, setOwnGenre] = useState<string | null>(null);
  const [decade, setDecade] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<string | null>(null);
  const [minYourStars, setMinYourStars] = useState<string | null>(null);
  const genre = held === undefined ? ownGenre : held.genre;
  const setGenre = held === undefined ? setOwnGenre : held.onGenreChange;

  const facets = useQuery(libraryQueries.facets()).data ?? NO_FACETS;
  const options = useMemo(() => buildFilterOptions(facets), [facets]);

  const offered = {
    'genre:': options.genres,
    'decade:': options.decades,
    'rating:': options.ratings,
    'yours:': options.yourStars,
  };

  const groups = GROUPS.map((group) => ({
    name: say(group.name),
    isSingle: true,
    options: offered[group.prefix].map((option) => ({
      id: `${group.prefix}${option.value}`,
      label: option.label,
    })),
  })).filter((group) => group.options.length > 0);

  const selected = new Set(
    [
      genre === null ? null : `genre:${genre}`,
      decade === null ? null : `decade:${decade}`,
      minRating === null ? null : `rating:${minRating}`,
      minYourStars === null ? null : `yours:${minYourStars}`,
    ].filter((id) => id !== null),
  );

  const change = (next: ReadonlySet<string>) => {
    const pick = (prefix: string): string | null =>
      [...next].find((id) => id.startsWith(prefix))?.slice(prefix.length) ?? null;

    setGenre(pick('genre:'));
    setDecade(pick('decade:'));
    setMinRating(pick('rating:'));
    setMinYourStars(pick('yours:'));
  };

  const clear = () => {
    setGenre(null);
    setDecade(null);
    setMinRating(null);
    setMinYourStars(null);
  };

  const asked = useMemo(() => {
    const startsAt = decade === null ? undefined : Number(decade);

    return {
      ...(genre === null ? {} : { genre }),
      ...(startsAt === undefined ? {} : { yearFrom: startsAt, yearTo: startsAt + DECADE - 1 }),
      ...(minRating === null ? {} : { minRating: Number(minRating) }),
      ...(minYourStars === null ? {} : { minYourStars: Number(minYourStars) }),
    };
  }, [genre, decade, minRating, minYourStars]);

  return { groups, selected, change, clear, asked };
};

export { useLibraryFilters };
