import { readEveryItemAsItComes } from '@ValenceClient/library/readEveryItemAsItComes';
import type { ListItemsOptions } from '@ValenceClient/library/fetchLibrary';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Reads everything in some libraries that matches a question, however many that is, ordered across
 * them all, by asking for the first page to learn the total and then the rest of them a few at a
 * time, uncounted, since the first page already said how many there are.
 *
 * @param libraryIds - The libraries to read.
 * @param options - What is being asked, without a limit or an offset, which are this function's.
 * @returns Everything that matched, in the order the server gave it.
 */
const readEveryItem = async (
  libraryIds: readonly string[],
  options: Omit<ListItemsOptions, 'limit' | 'offset'> = {},
): Promise<MediaSummary[]> => {
  const every: MediaSummary[] = [];

  for await (const page of readEveryItemAsItComes(libraryIds, options)) {
    every.push(...page);
  }

  return every;
};

export { readEveryItem };
