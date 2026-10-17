import { randomUUID } from 'node:crypto';
import { and, desc, eq, lt, or } from 'drizzle-orm';
import { AuditActionSchema } from '@ValenceContracts/schemas/Audit';
import { auditEntry } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { readAuditCursor, writeAuditCursor } from './auditCursor';
import type { AuditService } from './AuditService';

/**
 * The record of who changed what on this server, newest first, held in the database: roles, accounts,
 * settings, libraries, files, links, plugins, webhooks and backups.
 *
 * @param db - The database to read and write.
 * @param now - The clock.
 * @returns The audit service.
 */
const createDatabaseAuditService = (
  db: AnyValenceDatabase,
  now: () => Date = () => new Date(),
): AuditService => ({
  record: async (entry) => {
    await db.insert(auditEntry).values({
      id: randomUUID(),
      at: now(),
      actorId: entry.actorId,
      actorName: entry.actorName,
      action: entry.action,
      target: entry.target ?? null,
      detail: entry.detail === undefined || entry.detail === null ? null : { ...entry.detail },
    });
  },
  list: async ({ action, actorId, cursor, limit }) => {
    const after = cursor === undefined ? null : readAuditCursor(cursor);
    const rows = await db
      .select()
      .from(auditEntry)
      .where(
        and(
          action === undefined ? undefined : eq(auditEntry.action, action),
          actorId === undefined ? undefined : eq(auditEntry.actorId, actorId),
          after === null
            ? undefined
            : or(
                lt(auditEntry.at, after.at),
                and(eq(auditEntry.at, after.at), lt(auditEntry.id, after.id)),
              ),
        ),
      )
      .orderBy(desc(auditEntry.at), desc(auditEntry.id))
      .limit(limit + 1);
    const page = rows.slice(0, limit);
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
              },
            ]
          : [];
      }),
      nextCursor:
        rows.length > limit && last !== undefined
          ? writeAuditCursor({ at: last.at, id: last.id })
          : null,
    };
  },
});

export { createDatabaseAuditService };
