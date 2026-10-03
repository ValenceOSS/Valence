import { randomUUID } from 'node:crypto';
import { and, desc, eq, gt, inArray } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { toIso } from '@ValenceCore/functions/toIso';
import { QualityStepIdSchema } from '@ValenceContracts/schemas/QualityStep';
import { federationAudit, linkGrant, linkedServer, remotePerson } from '#dialect/Schema';
import {
  FederationActionSchema,
  FederationOutcomeSchema,
} from '@ValenceContracts/schemas/LinkSharing';
import { AUDIT_FOLDS_WITHIN_MS } from './AUDIT_FOLDS_WITHIN_MS';
import { sameAuditEvent } from './sameAuditEvent';
import type {
  FederationActivity,
  LinkSharing,
  RemotePerson,
} from '@ValenceContracts/schemas/LinkSharing';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { LinkSharingStore } from './LinkSharingStore';

/**
 * A person from another server as the admin sees them.
 *
 * @param row - The row as stored.
 * @returns The person.
 */
const personOf = (row: typeof remotePerson.$inferSelect): RemotePerson => ({
  id: row.id,
  name: row.name,
  firstSeenAt: row.firstSeenAt.toISOString(),
  lastSeenAt: row.lastSeenAt.toISOString(),
  blockedAt: toIso(row.blockedAt),
});

/**
 * What each linked server is shared, the people from there this server has seen, and the record of
 * what they asked for, kept in the database. Choosing the libraries replaces the whole choice at
 * once, so a server is never shared half of one choice and half of another.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseLinkSharingStore = (db: AnyValenceDatabase): LinkSharingStore => {
  const readSharing = async (linkedServerId: string): Promise<LinkSharing | null> => {
    const [server] = await db
      .select({
        maximumAge: linkedServer.maximumAge,
        allowsUnrated: linkedServer.allowsUnrated,
        namesTravel: linkedServer.namesTravel,
        showsActivity: linkedServer.showsActivity,
        mostStreams: linkedServer.mostStreams,
        qualityCeiling: linkedServer.qualityCeiling,
        takesTheirControls: linkedServer.takesTheirControls,
        allowsDownloads: linkedServer.allowsDownloads,
        takesTheirRequests: linkedServer.takesTheirRequests,
        playsDirect: linkedServer.playsDirect,
      })
      .from(linkedServer)
      .where(eq(linkedServer.id, linkedServerId));

    if (server === undefined) {
      return null;
    }

    const grants = await db
      .select({ libraryId: linkGrant.libraryId })
      .from(linkGrant)
      .where(eq(linkGrant.linkedServerId, linkedServerId));

    return {
      libraryIds: grants.map((grant) => grant.libraryId).sort(),
      maximumAge: server.maximumAge,
      allowsUnrated: server.allowsUnrated,
      namesTravel: server.namesTravel,
      showsActivity: server.showsActivity,
      mostStreams: server.mostStreams,
      qualityCeiling: QualityStepIdSchema.safeParse(server.qualityCeiling).data ?? null,
      takesTheirControls: server.takesTheirControls,
      allowsDownloads: server.allowsDownloads,
      takesTheirRequests: server.takesTheirRequests,
      playsDirect: server.playsDirect,
    };
  };

  return {
    readSharing,

    changeSharing: async (linkedServerId, { libraryIds, ...settings }) => {
      if ((await readSharing(linkedServerId)) === null) {
        return null;
      }

      await db.transaction(async (tx) => {
        if (Object.values(settings).some((value) => value !== undefined)) {
          await tx.update(linkedServer).set(settings).where(eq(linkedServer.id, linkedServerId));
        }

        if (libraryIds !== undefined) {
          await tx.delete(linkGrant).where(eq(linkGrant.linkedServerId, linkedServerId));

          if (libraryIds.length > 0) {
            await tx
              .insert(linkGrant)
              .values([...new Set(libraryIds)].map((libraryId) => ({ linkedServerId, libraryId })));
          }
        }
      });

      return readSharing(linkedServerId);
    },

    seePerson: async (linkedServerId, pseudonym, name, now) => {
      await upsert(db, remotePerson, {
        values: [
          {
            id: randomUUID(),
            linkedServerId,
            pseudonym,
            name,
            firstSeenAt: now,
            lastSeenAt: now,
            blockedAt: null,
          },
        ],
        target: [remotePerson.linkedServerId, remotePerson.pseudonym],
        set: { lastSeenAt: now, ...(name === null ? {} : { name }) },
      });

      const [row] = await db
        .select()
        .from(remotePerson)
        .where(
          and(
            eq(remotePerson.linkedServerId, linkedServerId),
            eq(remotePerson.pseudonym, pseudonym),
          ),
        );

      if (row === undefined) {
        throw new Error(`linking: the person ${pseudonym} was not there after seeing them`);
      }

      return personOf(row);
    },

    listPeople: async (linkedServerId) =>
      (
        await db
          .select()
          .from(remotePerson)
          .where(eq(remotePerson.linkedServerId, linkedServerId))
          .orderBy(desc(remotePerson.lastSeenAt))
      ).map(personOf),

    pseudonymOf: async (linkedServerId, personId) => {
      const [row] = await db
        .select({ pseudonym: remotePerson.pseudonym })
        .from(remotePerson)
        .where(and(eq(remotePerson.id, personId), eq(remotePerson.linkedServerId, linkedServerId)));

      return row?.pseudonym ?? null;
    },

    blockPerson: async (linkedServerId, personId, blockedAt) => {
      const whose = and(
        eq(remotePerson.id, personId),
        eq(remotePerson.linkedServerId, linkedServerId),
      );

      await db.update(remotePerson).set({ blockedAt }).where(whose);

      const [row] = await db.select().from(remotePerson).where(whose);

      return row === undefined ? null : personOf(row);
    },

    record: async (entry, now) => {
      const sameEventKey = sameAuditEvent(entry);
      const [last] = await db
        .select({ id: federationAudit.id, count: federationAudit.count })
        .from(federationAudit)
        .where(
          and(
            eq(federationAudit.sameEventKey, sameEventKey),
            gt(federationAudit.at, new Date(now.getTime() - AUDIT_FOLDS_WITHIN_MS)),
          ),
        )
        .orderBy(desc(federationAudit.at))
        .limit(1);

      if (last !== undefined) {
        await db
          .update(federationAudit)
          .set({ count: last.count + 1, at: now })
          .where(eq(federationAudit.id, last.id));

        return;
      }

      await db.insert(federationAudit).values({
        id: randomUUID(),
        ...entry,
        count: 1,
        sameEventKey,
        at: now,
      });
    },

    listActivity: async (linkedServerId, { since, personIds, limit }) => {
      if (personIds?.length === 0) {
        return [];
      }

      const rows = await db
        .select({
          id: federationAudit.id,
          at: federationAudit.at,
          personId: federationAudit.remotePersonId,
          personName: remotePerson.name,
          action: federationAudit.action,
          mediaTitle: federationAudit.mediaTitle,
          outcome: federationAudit.outcome,
          count: federationAudit.count,
        })
        .from(federationAudit)
        .leftJoin(remotePerson, eq(remotePerson.id, federationAudit.remotePersonId))
        .where(
          and(
            eq(federationAudit.linkedServerId, linkedServerId),
            since === undefined ? undefined : gt(federationAudit.at, since),
            personIds === undefined
              ? undefined
              : inArray(federationAudit.remotePersonId, [...personIds]),
          ),
        )
        .orderBy(desc(federationAudit.at))
        .limit(limit);

      return rows.flatMap((row): FederationActivity[] => {
        const action = FederationActionSchema.safeParse(row.action);
        const outcome = FederationOutcomeSchema.safeParse(row.outcome);

        return action.success && outcome.success
          ? [
              {
                id: row.id,
                at: row.at.toISOString(),
                personId: row.personId,
                personName: row.personName,
                action: action.data,
                mediaTitle: row.mediaTitle,
                outcome: outcome.data,
                count: row.count,
              },
            ]
          : [];
      });
    },
  };
};

export { createDatabaseLinkSharingStore };
