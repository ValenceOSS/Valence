import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { buildFilterOptions } from '@ValenceClient/library/buildFilterOptions';
import type { LibraryFacets } from '@ValenceContracts/schemas/Library';
import type { FilterGroup } from '@ValenceClient/library/FilterGroup';
import { say } from '@ValenceI18n/say';

const NO_FACETS: LibraryFacets = { genres: [], decades: [], maxRating: 0 };

const NOTHING_CHOSEN: ReadonlySet<string> = new Set();

const GROUPS = [
  { name: say('common.genre'), prefix: 'genre:', isSingle: false },
  { name: say('common.rating'), prefix: 'rating:', isSingle: true },
  { name: say('common.decade'), prefix: 'decade:', isSingle: false },
  { name: say('common.yourRating'), prefix: 'yours:', isSingle: true },
] as const;

/**
 * What somebody has narrowed a page of the library by — any of several genres and decades, a
 * rating and their own rating at least — and the choices the libraries actually offer for each, so
 * nobody is offered a filter that would only lead to an empty page. Returns them in the shape a
 * filter menu and its applied chips take, and as the question to put to the libraries.
 *
 * Every choice is one entry of a set, such as `genre:Drama` or `decade:1990`, which the caller can
 * hold — in the address, so a narrowed page can be shared — or leave to be held here. The question
 * is the same object for as long as the choices are, so it can be a dependency.
 *
 * @param held - What is chosen and the way to change it, where the caller keeps it.
 * @returns The choices, what is chosen, how to change or clear it, and it as a query.
 */
const useLibraryFilters = (held?: {
  selected: ReadonlySet<string>;
  onChange: (next: ReadonlySet<string>) => void;
}): {
  groups: FilterGroup[];
  selected: ReadonlySet<string>;
  change: (next: ReadonlySet<string>) => void;
  clear: () => void;
  asked: {
    genres?: string[];
    decades?: number[];
    minRating?: number;
    minYourStars?: number;
  };
} => {
  const [own, setOwn] = useState<ReadonlySet<string>>(NOTHING_CHOSEN);
  const selected = held === undefined ? own : held.selected;
  const change = held === undefined ? setOwn : held.onChange;

  const facets = useQuery(libraryQueries.facets()).data ?? NO_FACETS;
  const options = useMemo(() => buildFilterOptions(facets), [facets]);

  const offered = {
    'genre:': options.genres,
    'decade:': options.decades,
    'rating:': options.ratings,
    'yours:': options.yourStars,
  };

  const groups = GROUPS.map((group) => ({
    name: group.name,
    isSingle: group.isSingle,
    options: offered[group.prefix].map((option) => ({
      id: `${group.prefix}${option.value}`,
      label: option.label,
    })),
  })).filter((group) => group.options.length > 0);

  const key = [...selected].sort().join('|');

  const asked = useMemo(() => {
    const every = (prefix: string): string[] =>
      key
        .split('|')
        .filter((id) => id.startsWith(prefix))
        .map((id) => id.slice(prefix.length));
    const genres = every('genre:');
    const decades = every('decade:').map(Number).filter(Number.isInteger);
    const minRating = every('rating:')[0];
    const minYourStars = every('yours:')[0];

    return {
      ...(genres.length === 0 ? {} : { genres }),
      ...(decades.length === 0 ? {} : { decades }),
      ...(minRating === undefined ? {} : { minRating: Number(minRating) }),
      ...(minYourStars === undefined ? {} : { minYourStars: Number(minYourStars) }),
    };
  }, [key]);

  return {
    groups,
    selected,
    change,
    clear: () => {
      change(NOTHING_CHOSEN);
    },
    asked,
  };
};

export { useLibraryFilters };
