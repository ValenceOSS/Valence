import type { RailOpens } from '@ValenceClient/library/groupIntoRails';

/**
 * Where a home page row drawn from a genre, a decade or both leads: the search page narrowed the
 * same way, since it lists films and programmes together as the row does.
 *
 * @param drawnFrom - The genre and the decade the row was drawn from, either of which may be none.
 * @param drawnFrom.genre - The genre, or null.
 * @param drawnFrom.decade - The decade, or null.
 * @returns Where it leads, or null for a row drawn from neither.
 */
const railOpensOf = ({
  genre,
  decade,
}: {
  genre: string | null;
  decade: number | null;
}): RailOpens | null => {
  const filters = [
    ...(genre === null ? [] : [`genre:${genre}`]),
    ...(decade === null ? [] : [`decade:${decade.toString()}`]),
  ];

  return filters.length === 0 ? null : { section: 'search', filters: filters.join(',') };
};

export { railOpensOf };
