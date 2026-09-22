import { AboutSchema } from '@ValenceContracts/schemas/About';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import type { About } from '@ValenceContracts/schemas/About';

/**
 * Asks the server what it is running, for whoever is comparing what a client expects against what
 * actually answered it.
 *
 * @returns The commit the server was started from.
 */
const fetchServerBuildInfo = (): Promise<About> => readFromServer('/api/about', AboutSchema);

export { fetchServerBuildInfo };
