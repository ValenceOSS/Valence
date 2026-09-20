import { ilike, or } from 'drizzle-orm';
import { logRecord } from '@ValenceServer/db/Schema';
import type { SQL } from 'drizzle-orm';

/**
 * Builds the condition that finds log records matching what somebody typed into the search box:
 * the message and its detail, the source and kind of job, and every identifier a record carries,
 * so a job, a session or a request can be found by the id that was copied from somewhere else.
 *
 * The alternatives are grouped as one condition, so that joined to the level and time filters they
 * narrow the result rather than widening it past them.
 *
 * @param search - What was typed, or an empty string where nothing was.
 * @returns The condition, or undefined where there is nothing to look for.
 */
const logSearchFilter = (search: string): SQL | undefined => {
  const looking = search.trim();

  if (looking === '') {
    return undefined;
  }

  const pattern = `%${looking.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;

  return or(
    ilike(logRecord.message, pattern),
    ilike(logRecord.detail, pattern),
    ilike(logRecord.source, pattern),
    ilike(logRecord.jobKind, pattern),
    ilike(logRecord.id, pattern),
    ilike(logRecord.jobId, pattern),
    ilike(logRecord.libraryId, pattern),
    ilike(logRecord.mediaId, pattern),
    ilike(logRecord.sessionId, pattern),
    ilike(logRecord.requestId, pattern),
  );
};

export { logSearchFilter };
