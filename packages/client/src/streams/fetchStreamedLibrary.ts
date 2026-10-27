import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';

/**
 * Reads which hidden library films played from sources are kept in, so what somebody is part way
 * through can be read from it by id.
 *
 * @returns Its id.
 */
const fetchStreamedLibrary = async (): Promise<string> =>
  (await readFromServer('/api/streams/library', z.object({ libraryId: z.string() }))).libraryId;

export { fetchStreamedLibrary };
