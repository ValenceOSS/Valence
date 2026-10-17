import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { StatisticsRange } from '@ValenceContracts/schemas/Statistics';

/**
 * Reads the server's statistics over a range, on the clock of whoever is looking.
 *
 * @param range - How far back to look.
 * @returns The query.
 */
const useStatistics = (range: StatisticsRange) =>
  useQuery(adminQueries.statistics(range, Intl.DateTimeFormat().resolvedOptions().timeZone));

export { useStatistics };
