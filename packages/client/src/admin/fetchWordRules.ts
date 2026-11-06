import { readFromServer } from '@ValenceClient/query/readFromServer';
import { WordRulesSchema } from '@ValenceContracts/schemas/WordRule';
import type { WordRule } from '@ValenceContracts/schemas/WordRule';

/**
 * Reads a library's rules for the genres its scans read, such as always calling one genre another.
 *
 * @param libraryId - The library.
 * @returns Its rules.
 */
const fetchWordRules = async (libraryId: string): Promise<WordRule[]> =>
  (await readFromServer(`/api/libraries/${libraryId}/word-rules`, WordRulesSchema)).rules;

export { fetchWordRules };
