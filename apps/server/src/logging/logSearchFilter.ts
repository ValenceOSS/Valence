import { or } from 'drizzle-orm';
import { logRecord } from '#dialect/Schema';
import { containsInsensitively } from '@ValenceDatabase/containsInsensitively';
import { likeLiterally } from '@ValenceDatabase/likeLiterally';
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

  const pattern = `%${likeLiterally(looking)}%`;

  return or(
    containsInsensitively(logRecord.message, pattern),
    containsInsensitively(logRecord.detail, pattern),
    containsInsensitively(logRecord.source, pattern),
    containsInsensitively(logRecord.jobKind, pattern),
    containsInsensitively(logRecord.id, pattern),
    containsInsensitively(logRecord.jobId, pattern),
    containsInsensitively(logRecord.libraryId, pattern),
    containsInsensitively(logRecord.mediaId, pattern),
    containsInsensitively(logRecord.sessionId, pattern),
    containsInsensitively(logRecord.requestId, pattern),
  );
};

export { logSearchFilter };
