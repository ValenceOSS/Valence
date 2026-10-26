import { readFromServer } from '@ValenceClient/query/readFromServer';
import { whySearchFailed } from '@ValenceClient/query/whySearchFailed';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

/**
 * Runs a search for a picker, answering with why it could not search where it could not — that a
 * site is rate limiting or unreachable — rather than with nothing, which reads as nothing found.
 *
 * @param path - Where to search.
 * @param schema - The shape the answer must be in.
 * @returns What was found, or the problem to show in its place.
 */
const searchSayingWhy = async <Found>(
  path: string,
  schema: { parse: (body: JsonValue) => { matches: Found[] } },
): Promise<Found[] | { problem: string }> => {
  try {
    return (await readFromServer(path, schema)).matches;
  } catch (error) {
    return { problem: whySearchFailed(error instanceof Error ? error : null) };
  }
};

export { searchSayingWhy };
