import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TitleChoicesSchema } from '@ValenceContracts/schemas/TitleList';
import type { TitleChoices } from '@ValenceContracts/schemas/TitleList';

/**
 * Reads what a library's filters can be set to, with how many titles each shows.
 *
 * @param libraryId - The library.
 * @returns The values of each filter.
 */
const fetchTitleChoices = (libraryId: string): Promise<TitleChoices> =>
  readFromServer(
    `/api/admin/titles/choices?${new URLSearchParams({ libraryId }).toString()}`,
    TitleChoicesSchema,
  );

export { fetchTitleChoices };
