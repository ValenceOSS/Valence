import { randomUUID } from 'node:crypto';
import type { AuditEntry } from '@ValenceContracts/schemas/Audit';
import { readAuditCursor, writeAuditCursor } from './auditCursor';
import type { AuditService } from './AuditService';

/**
 * The audit log held in memory, for a server running without a database, kept until it stops.
 *
 * @param now - The clock.
 * @returns The audit service.
 */
const createMemoryAuditService = (now: () => Date = () => new Date()): AuditService => {
  const entries: AuditEntry[] = [];

  return {
    record: (entry) => {
      entries.unshift({
        id: randomUUID(),
        at: now().toISOString(),
        actorId: entry.actorId,
        actorName: entry.actorName,
        action: entry.action,
        target: entry.target ?? null,
        detail: entry.detail === undefined || entry.detail === null ? null : { ...entry.detail },
      });

      return Promise.resolve();
    },
    list: ({ action, actorId, cursor, limit }) => {
      const after = cursor === undefined ? null : readAuditCursor(cursor);
      const matching = entries.filter(
        (entry) =>
          (action === undefined || entry.action === action) &&
          (actorId === undefined || entry.actorId === actorId),
      );
      const start =
        after === null
          ? 0
          : matching.findIndex(
              (entry) =>
                new Date(entry.at) < after.at ||
                (new Date(entry.at).getTime() === after.at.getTime() && entry.id < after.id),
            );
      const rest = start === -1 ? [] : matching.slice(start);
      const page = rest.slice(0, limit);
      const last = page.at(-1);

      return Promise.resolve({
        entries: page,
        nextCursor:
          rest.length > limit && last !== undefined
            ? writeAuditCursor({ at: new Date(last.at), id: last.id })
            : null,
      });
    },
  };
};

export { createMemoryAuditService };
