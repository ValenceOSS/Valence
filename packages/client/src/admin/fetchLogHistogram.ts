import { LogHistogramSchema } from '@ValenceContracts/schemas/Log';
import { postForLogs } from './postForLogs';
import type { LogHistogram, LogHistogramQuery } from '@ValenceContracts/schemas/Log';

const NOTHING: LogHistogram = { fromMs: 0, untilMs: 0, bucketMs: 60_000, buckets: [] };

/**
 * Reads how many events the log holds at each level over time, for the records a query matches.
 *
 * @param query - What to count, and how many bars to count it into.
 * @returns The bars, earliest first, or none where the server could not say.
 */
const fetchLogHistogram = (query: Partial<LogHistogramQuery>): Promise<LogHistogram> =>
  postForLogs('/api/admin/logs/histogram', query, LogHistogramSchema, NOTHING);

export { fetchLogHistogram };
