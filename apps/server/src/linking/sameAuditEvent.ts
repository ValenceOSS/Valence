import type { AuditEntry } from './LinkSharingStore';

/**
 * What makes two entries of the audit the same thing happening again: the same server, the same
 * person, the same kind of request, about the same title, with the same outcome. Those are folded
 * into one entry with a count, so a film streamed segment by segment is one line rather than a
 * thousand.
 *
 * @param entry - The entry.
 * @returns Its key.
 */
const sameAuditEvent = (entry: AuditEntry): string =>
  [
    entry.linkedServerId,
    entry.remotePersonId ?? '-',
    entry.action,
    entry.mediaId ?? '-',
    entry.outcome,
  ].join(':');

export { sameAuditEvent };
