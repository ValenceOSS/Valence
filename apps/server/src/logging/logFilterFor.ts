import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { logRecord } from '@ValenceServer/db/Schema';
import { logSearchFilter } from './logSearchFilter';
import type { SQL } from 'drizzle-orm';
import type { LogHistogramQuery } from '@ValenceContracts/schemas/Log';

type LogFilters = Omit<LogHistogramQuery, 'buckets'>;

/**
 * Builds the condition every record a query asks for satisfies, shared between reading a page of
 * records and counting them into a histogram, so the graph always describes exactly the rows the
 * table beneath it lists.
 *
 * @param filters - What the records are filtered by.
 * @returns The condition, or nothing where the query filters by nothing.
 */
const logFilterFor = (filters: LogFilters): SQL | undefined => {
  const wheres = [
    filters.levels.length === 0 ? undefined : inArray(logRecord.level, [...filters.levels]),
    filters.sources.length === 0 ? undefined : inArray(logRecord.source, [...filters.sources]),
    filters.jobKinds.length === 0 ? undefined : inArray(logRecord.jobKind, [...filters.jobKinds]),
    logSearchFilter(filters.search),
    filters.sinceMs === null ? undefined : gte(logRecord.at, new Date(filters.sinceMs)),
    filters.untilMs === null ? undefined : lte(logRecord.at, new Date(filters.untilMs)),
    filters.jobId === null ? undefined : eq(logRecord.jobId, filters.jobId),
    filters.libraryId === null ? undefined : eq(logRecord.libraryId, filters.libraryId),
    filters.mediaId === null ? undefined : eq(logRecord.mediaId, filters.mediaId),
    filters.sessionId === null ? undefined : eq(logRecord.sessionId, filters.sessionId),
    filters.requestId === null ? undefined : eq(logRecord.requestId, filters.requestId),
  ].filter((one) => one !== undefined);

  return wheres.length === 0 ? undefined : and(...wheres);
};

export type { LogFilters };

export { logFilterFor };
