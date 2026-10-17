import { readFromServer } from '@ValenceClient/query/readFromServer';
import { StatisticsSchema } from '@ValenceContracts/schemas/Statistics';
import type { Statistics, StatisticsRange } from '@ValenceContracts/schemas/Statistics';

/**
 * Reads what was watched on the server over a range, how it was delivered and what arrived, with
 * days and hours on this viewer's own clock.
 *
 * @param range - How far back to look.
 * @param zone - The viewer's time zone.
 * @returns The statistics.
 */
const fetchStatistics = (range: StatisticsRange, zone: string): Promise<Statistics> =>
  readFromServer(
    `/api/admin/statistics?${new URLSearchParams({ range, zone }).toString()}`,
    StatisticsSchema,
  );

export { fetchStatistics };
