import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gt, gte, inArray, lt, lte, notInArray, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import { containsInsensitively } from '@ValenceDatabase/containsInsensitively';
import { isNotDistinctFrom } from '@ValenceDatabase/isNotDistinctFrom';
import { likeLiterally } from '@ValenceDatabase/likeLiterally';
import { AuditActionSchema } from '@ValenceContracts/schemas/Audit';
import type { AuditQuery } from '@ValenceContracts/schemas/Audit';
import { auditEntry } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { readAuditCursor, writeAuditCursor } from './auditCursor';
import { auditExpiry } from './auditExpiry';
import { mergeAuditDetail } from './mergeAuditDetail';
import { SIGN_IN_AUDIT_ACTIONS } from './SIGN_IN_AUDIT_ACTIONS';
import type { AuditService } from './AuditService';

/**
 * The conditions a page of the log is narrowed by: what kind of change, whose, when, and words
 * found in who did it, what it was done to or where it came from.
 *
 * @param query - What the log is narrowed to.
 * @returns The condition every entry shown satisfies.
 */
const narrowedBy = (query: AuditQuery): SQL | undefined => {
  const pattern = `%${likeLiterally(query.search ?? '')}%`;

  return and(
    query.action === undefined ? undefined : eq(auditEntry.action, query.action),
    query.category === undefined
      ? undefined
      : containsInsensitively(auditEntry.action, `${likeLiterally(query.category)}.%`),
    query.actorId === undefined ? undefined : eq(auditEntry.actorId, query.actorId),
    query.sinceMs === undefined ? undefined : gte(auditEntry.at, new Date(query.sinceMs)),
    query.untilMs === undefined ? undefined : lte(auditEntry.at, new Date(query.untilMs)),
    query.search === undefined || query.search === ''
      ? undefined
      : or(
          containsInsensitively(auditEntry.actorName, pattern),
          containsInsensitively(auditEntry.target, pattern),
          containsInsensitively(auditEntry.address, pattern),
        ),
  );
};

/**
 * The record of who changed what on this server, held in the database: sign-ins, accounts,
 * profiles, roles, libraries and what is in them, requests, settings, plugins, webhooks and backups.
 *
 * @param db - The database to read and write.
 * @param now - The clock.
 * @returns The audit service.
 */
const createDatabaseAuditService = (
  db: AnyValenceDatabase,
  now: () => Date = () => new Date(),
): AuditService => ({
  record: async (entry, recording = {}) => {
    const at = now();
    const detail = entry.detail === undefined || entry.detail === null ? null : { ...entry.detail };

    if (recording.foldWithinMs !== undefined) {
      const [last] = await db
        .select({ id: auditEntry.id, detail: auditEntry.detail })
        .from(auditEntry)
        .where(
          and(
            isNotDistinctFrom(auditEntry.actorId, entry.actorId),
            eq(auditEntry.action, entry.action),
            isNotDistinctFrom(auditEntry.target, entry.target ?? null),
            isNotDistinctFrom(auditEntry.address, entry.address ?? null),
            gte(auditEntry.at, new Date(at.getTime() - recording.foldWithinMs)),
          ),
        )
        .orderBy(desc(auditEntry.at), desc(auditEntry.id))
        .limit(1);

      if (last !== undefined) {
        await db
          .update(auditEntry)
          .set({ at, detail: mergeAuditDetail(last.detail ?? null, detail) })
          .where(eq(auditEntry.id, last.id));

        return;
      }
    }

    await db.insert(auditEntry).values({
      id: randomUUID(),
      at,
      actorId: entry.actorId,
      actorName: entry.actorName,
      action: entry.action,
      target: entry.target ?? null,
      detail,
      address: entry.address ?? null,
      userAgent: entry.userAgent ?? null,
    });
  },
  list: async (query) => {
    const after = query.cursor === undefined ? null : readAuditCursor(query.cursor);
    const isOldestFirst = query.order === 'oldest';
    const beyond = isOldestFirst ? gt : lt;
    const ordered = isOldestFirst ? asc : desc;
    const rows = await db
      .select()
      .from(auditEntry)
      .where(
        and(
          narrowedBy(query),
          after === null
            ? undefined
            : or(
                beyond(auditEntry.at, after.at),
                and(eq(auditEntry.at, after.at), beyond(auditEntry.id, after.id)),
              ),
        ),
      )
      .orderBy(ordered(auditEntry.at), ordered(auditEntry.id))
      .limit(query.limit + 1);
    const page = rows.slice(0, query.limit);
    const last = page.at(-1);

    return {
      entries: page.flatMap((row) => {
        const known = AuditActionSchema.safeParse(row.action);

        return known.success
          ? [
              {
                id: row.id,
                at: row.at.toISOString(),
                actorId: row.actorId,
                actorName: row.actorName,
                action: known.data,
                target: row.target,
                detail: row.detail ?? null,
                address: row.address,
                userAgent: row.userAgent,
              },
            ]
          : [];
      }),
      nextCursor:
        rows.length > query.limit && last !== undefined
          ? writeAuditCursor({ at: last.at, id: last.id })
          : null,
    };
  },
  prune: async (at) => {
    const expiry = auditExpiry(at);
    const gone = await db
      .delete(auditEntry)
      .where(
        or(
          and(
            inArray(auditEntry.action, [...SIGN_IN_AUDIT_ACTIONS]),
            lt(auditEntry.at, expiry.signIns),
          ),
          and(
            notInArray(auditEntry.action, [...SIGN_IN_AUDIT_ACTIONS]),
            lt(auditEntry.at, expiry.changes),
          ),
        ),
      );

    return countAffected(gone);
  },
});

export { createDatabaseAuditService };
