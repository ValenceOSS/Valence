import { readFromServer } from '@ValenceClient/query/readFromServer';
import { HomeShelvesSchema } from '@ValenceContracts/schemas/HomeShelves';
import type { HomeShelves } from '@ValenceContracts/schemas/HomeShelves';

/**
 * Reads the next page of the front page's endless shelves.
 *
 * @param asked - The libraries to draw from, the genres the viewer leans towards, where the last page
 *   left off (nothing for the first page), and how many shelves to read.
 * @returns The shelves, and where the next page begins.
 */
const fetchHomeShelves = ({
  libraryIds,
  leaning,
  cursor,
  count,
}: {
  libraryIds: readonly string[];
  leaning: readonly string[];
  cursor: string;
  count: number;
}): Promise<HomeShelves> => {
  const query = new URLSearchParams({ libraryIds: libraryIds.join(','), count: count.toString() });

  if (leaning.length > 0) {
    query.set('leaning', leaning.join(','));
  }

  if (cursor !== '') {
    query.set('cursor', cursor);
  }

  return readFromServer(`/api/home-shelves?${query.toString()}`, HomeShelvesSchema);
};

export { fetchHomeShelves };
