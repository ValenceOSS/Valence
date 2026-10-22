import type { AuditEntry, AuditQuery } from '@ValenceContracts/schemas/Audit';

/**
 * Whether an entry belongs on a page of the log narrowed the way the query asks: its kind of
 * change, whose, when, and words found in who did it, what it was done to or where it came from.
 *
 * @param entry - The entry.
 * @param query - What the log is narrowed to.
 * @returns Whether it is shown.
 */
const auditEntryMatches = (entry: AuditEntry, query: AuditQuery): boolean => {
  const atMs = Date.parse(entry.at);
  const words = (query.search ?? '').toLowerCase();

  return (
    (query.action === undefined || entry.action === query.action) &&
    (query.category === undefined || entry.action.startsWith(`${query.category}.`)) &&
    (query.actorId === undefined || entry.actorId === query.actorId) &&
    (query.sinceMs === undefined || atMs >= query.sinceMs) &&
    (query.untilMs === undefined || atMs <= query.untilMs) &&
    (words === '' ||
      [entry.actorName, entry.target, entry.address].some(
        (said) => said?.toLowerCase().includes(words) === true,
      ))
  );
};

export { auditEntryMatches };
