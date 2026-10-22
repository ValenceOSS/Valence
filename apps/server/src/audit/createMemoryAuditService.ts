import { randomUUID } from 'node:crypto';
import type { AuditEntry } from '@ValenceContracts/schemas/Audit';
import { auditEntryMatches } from './auditEntryMatches';
import { readAuditCursor, writeAuditCursor } from './auditCursor';
import { auditExpiry } from './auditExpiry';
import { mergeAuditDetail } from './mergeAuditDetail';
import { SIGN_IN_AUDIT_ACTIONS } from './SIGN_IN_AUDIT_ACTIONS';
import type { AuditService } from './AuditService';

/**
 * Orders two entries newest first, the later-written first where two share a moment.
 *
 * @param left - One entry.
 * @param right - The other.
 * @returns Which comes first.
 */
const newestFirst = (left: AuditEntry, right: AuditEntry): number =>
  Date.parse(right.at) - Date.parse(left.at) ||
  (right.id > left.id ? 1 : right.id < left.id ? -1 : 0);

/**
 * The audit log held in memory, for a server running without a database, kept until it stops.
 *
 * @param now - The clock.
 * @returns The audit service.
 */
const createMemoryAuditService = (now: () => Date = () => new Date()): AuditService => {
  let entries: AuditEntry[] = [];

  return {
    record: (entry, recording = {}) => {
      const at = now();
      const detail =
        entry.detail === undefined || entry.detail === null ? null : { ...entry.detail };
      const folded =
        recording.foldWithinMs === undefined
          ? -1
          : entries.findIndex(
              (one) =>
                one.actorId === entry.actorId &&
                one.action === entry.action &&
                one.target === (entry.target ?? null) &&
                one.address === (entry.address ?? null) &&
                Date.parse(one.at) >= at.getTime() - (recording.foldWithinMs ?? 0),
            );
      const last = entries[folded];

      if (last !== undefined) {
        entries[folded] = {
          ...last,
          at: at.toISOString(),
          detail: mergeAuditDetail(last.detail, detail),
        };
        entries.sort(newestFirst);

        return Promise.resolve();
      }

      entries.unshift({
        id: randomUUID(),
        at: at.toISOString(),
        actorId: entry.actorId,
        actorName: entry.actorName,
        action: entry.action,
        target: entry.target ?? null,
        detail,
        address: entry.address ?? null,
        userAgent: entry.userAgent ?? null,
      });
      entries.sort(newestFirst);

      return Promise.resolve();
    },
    list: (query) => {
      const after = query.cursor === undefined ? null : readAuditCursor(query.cursor);
      const isOldestFirst = query.order === 'oldest';
      const matching = entries
        .filter((entry) => auditEntryMatches(entry, query))
        .sort((left, right) => (isOldestFirst ? -1 : 1) * newestFirst(left, right));
      const isBeyond = (entry: AuditEntry) => {
        if (after === null) {
          return true;
        }

        const order = newestFirst(entry, { ...entry, at: after.at.toISOString(), id: after.id });

        return isOldestFirst ? order < 0 : order > 0;
      };
      const rest = matching.filter(isBeyond);
      const page = rest.slice(0, query.limit);
      const last = page.at(-1);

      return Promise.resolve({
        entries: page,
        nextCursor:
          rest.length > query.limit && last !== undefined
            ? writeAuditCursor({ at: new Date(last.at), id: last.id })
            : null,
      });
    },
    prune: (at) => {
      const expiry = auditExpiry(at);
      const kept = entries.filter(
        (entry) =>
          Date.parse(entry.at) >=
          (SIGN_IN_AUDIT_ACTIONS.includes(entry.action)
            ? expiry.signIns
            : expiry.changes
          ).getTime(),
      );
      const forgotten = entries.length - kept.length;

      entries = kept;

      return Promise.resolve(forgotten);
    },
  };
};

export { createMemoryAuditService };
