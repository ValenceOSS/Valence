import { SearchScopeSchema } from '@ValenceContracts/schemas/MediaRequest';
import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Reads which season, or which episode of it, a search is narrowed to from an address's query,
 * where it is narrowed at all.
 *
 * @param season - The season asked, as the query wrote it.
 * @param episode - The episode asked, as the query wrote it.
 * @returns The scope, or nothing for the whole request.
 */
const readSearchScope = (
  season: string | undefined,
  episode: string | undefined,
): SearchScope | null => {
  if (season === undefined) {
    return null;
  }

  const read = SearchScopeSchema.safeParse({
    season: Number(season),
    episode: episode === undefined ? null : Number(episode),
  });

  return read.success ? read.data : null;
};

export { readSearchScope };
