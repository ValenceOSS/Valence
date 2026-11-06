import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TitleCandidatesSchema } from '@ValenceContracts/schemas/TitleList';
import type { TitleCandidates } from '@ValenceContracts/schemas/TitleList';

/**
 * Finds what a title might be in the catalogue, for Fix match: by name a page at a time, or by a
 * pasted TMDB address or number or an IMDb id.
 *
 * @param query - What was typed or pasted.
 * @param kind - Whether films or programmes are wanted.
 * @param page - Which page, counting from one.
 * @returns The page, whether there is more, and how many there are, or why it could not be asked.
 */
const fetchTitleCandidates = async (
  query: string,
  kind: 'tv' | 'movie',
  page = 1,
): Promise<TitleCandidates | { problem: string }> => {
  const asked = `?${new URLSearchParams({ query, kind, page: page.toString() }).toString()}`;

  try {
    return await readFromServer(`/api/admin/titles/candidates${asked}`, TitleCandidatesSchema);
  } catch (error) {
    return { problem: error instanceof Error ? error.message : String(error) };
  }
};

export { fetchTitleCandidates };
