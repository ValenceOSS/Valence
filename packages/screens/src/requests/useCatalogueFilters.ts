import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import type { CatalogueBrowse, CatalogueFilters } from '@ValenceContracts/schemas/CatalogueTitle';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';

const DECADES = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950] as const;

const RATING_FLOORS = [6, 7, 8] as const;

const DECADE = 10;

/**
 * What somebody has narrowed a whole list of films or series to ask for by — a genre, a decade, a
 * least rating — and the choices to offer for each, in the shape a filter menu and its applied
 * chips take, and as the question to put to the catalogue.
 *
 * The genres are the catalogue's own for that kind, since films and series do not share every one.
 * Each row takes one choice at a time. The question is the same object for as long as the choices
 * are, so it can be a dependency of a query.
 *
 * @param kind - Whether the list is films or series, which decides the genres on offer.
 * @returns The choices, what is chosen, how to change or clear it, and it as a question.
 */
const useCatalogueFilters = (
  kind: CatalogueBrowse['kind'],
): {
  groups: FilterGroup[];
  selected: ReadonlySet<string>;
  change: (next: ReadonlySet<string>) => void;
  clear: () => void;
  asked: CatalogueFilters;
} => {
  const [genre, setGenre] = useState<string | null>(null);
  const [decade, setDecade] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<string | null>(null);

  const genres = useQuery(requestsQueries.catalogueGenres(kind)).data ?? [];

  const groups: FilterGroup[] = [
    {
      name: 'Genre',
      isSingle: true,
      options: genres.map((entry) => ({ id: `genre:${entry.id}`, label: entry.name })),
    },
    {
      name: 'Decade',
      isSingle: true,
      options: DECADES.map((start) => ({
        id: `decade:${start.toString()}`,
        label: `${start.toString()}s`,
      })),
    },
    {
      name: 'Rating',
      isSingle: true,
      options: RATING_FLOORS.map((floor) => ({
        id: `rating:${floor.toString()}`,
        label: `${floor.toString()}+`,
      })),
    },
  ].filter((group) => group.options.length > 0);

  const selected = new Set(
    [
      genre === null ? null : `genre:${genre}`,
      decade === null ? null : `decade:${decade}`,
      minRating === null ? null : `rating:${minRating}`,
    ].filter((id) => id !== null),
  );

  const change = (next: ReadonlySet<string>) => {
    const pick = (prefix: string): string | null =>
      [...next].find((id) => id.startsWith(prefix))?.slice(prefix.length) ?? null;

    setGenre(pick('genre:'));
    setDecade(pick('decade:'));
    setMinRating(pick('rating:'));
  };

  const clear = () => {
    setGenre(null);
    setDecade(null);
    setMinRating(null);
  };

  const asked = useMemo((): CatalogueFilters => {
    const startsAt = decade === null ? undefined : Number(decade);

    return {
      ...(genre === null ? {} : { genre }),
      ...(startsAt === undefined ? {} : { yearFrom: startsAt, yearTo: startsAt + DECADE - 1 }),
      ...(minRating === null ? {} : { minRating: Number(minRating) }),
    };
  }, [genre, decade, minRating]);

  return { groups, selected, change, clear, asked };
};

export { useCatalogueFilters };
