import { LogFacetsSchema } from '@ValenceContracts/schemas/Log';
import { postForLogs } from './postForLogs';
import type { LogFacets, LogFacetsQuery } from '@ValenceContracts/schemas/Log';

const NOTHING: LogFacets = { sources: [], jobKinds: [] };

/**
 * Reads which sources and kinds of job the records a query matches come from most often.
 *
 * @param query - What to count.
 * @returns The most common of each, or none where the server could not say.
 */
const fetchLogFacets = (query: Partial<LogFacetsQuery>): Promise<LogFacets> =>
  postForLogs('/api/admin/logs/facets', query, LogFacetsSchema, NOTHING);

export { fetchLogFacets };
