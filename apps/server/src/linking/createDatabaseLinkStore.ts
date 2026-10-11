import { randomUUID } from 'node:crypto';
import { and, asc, eq, gt, isNull } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import { toIso } from '@ValenceCore/functions/toIso';
import { linkDecline, linkInvite, linkedServer } from '#dialect/Schema';
import { LinkStateSchema, PublicServerKeySchema } from '@ValenceContracts/schemas/LinkedServer';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { LinkStore, StoredLinkedServer } from './LinkStore';

/**
 * A stored server as the rest of the server reads it, or nothing where the row has been tampered
 * with into something that is not one.
 *
 * @param row - The row as stored.
 * @returns The server, as a list of one or none.
 */
const readServerRow = (row: typeof linkedServer.$inferSelect): StoredLinkedServer[] => {
  const state = LinkStateSchema.safeParse(row.state);
  const publicKey = PublicServerKeySchema.safeParse(row.publicKey);

  if (!state.success || !publicKey.success) {
    return [];
  }

  return [
    {
      id: row.id,
      name: row.name,
      colour: row.colour,
      address: row.address,
      fingerprint: row.fingerprint,
      publicKey: publicKey.data,
      state: state.data,
      theirPairingId: row.theirPairingId,
      createdAt: row.createdAt.toISOString(),
      linkedAt: toIso(row.linkedAt),
      lastSeenAt: toIso(row.lastSeenAt),
      pictureAt: row.pictureAt,
    },
  ];
};

/**
 * The servers this one is linked with, or on the way to being, and the invites it has open, kept in
 * the database. An invite's code is kept only as its hash, as any other credential is, and spending
 * one is a single conditional update, so two servers answering the same invite at once cannot both
 * get in.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseLinkStore = (db: AnyValenceDatabase): LinkStore => {
  const readServer = async (id: string) => {
    const rows = await db.select().from(linkedServer).where(eq(linkedServer.id, id));

    return rows.flatMap(readServerRow)[0] ?? null;
  };

  return {
    listInvites: async (now) => {
      const rows = await db
        .select()
        .from(linkInvite)
        .where(and(isNull(linkInvite.usedAt), gt(linkInvite.expiresAt, now)))
        .orderBy(asc(linkInvite.createdAt));

      return rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      }));
    },

    addInvite: async (codeHash, expiresAt) => {
      const id = randomUUID();
      const createdAt = new Date();

      await db.insert(linkInvite).values({ id, codeHash, createdAt, expiresAt, usedAt: null });

      return { id, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString() };
    },

    withdrawInvite: async (id) =>
      countAffected(await db.delete(linkInvite).where(eq(linkInvite.id, id))) > 0,

    spendInvite: async (codeHash, now) =>
      countAffected(
        await db
          .update(linkInvite)
          .set({ usedAt: now })
          .where(
            and(
              eq(linkInvite.codeHash, codeHash),
              isNull(linkInvite.usedAt),
              gt(linkInvite.expiresAt, now),
            ),
          ),
      ) > 0,

    listServers: async () => {
      const rows = await db.select().from(linkedServer).orderBy(asc(linkedServer.createdAt));

      return rows.flatMap(readServerRow);
    },

    readServer,

    readServerByFingerprint: async (fingerprint) => {
      const rows = await db
        .select()
        .from(linkedServer)
        .where(eq(linkedServer.fingerprint, fingerprint));

      return rows.flatMap(readServerRow)[0] ?? null;
    },

    addServer: async (server) => {
      const id = randomUUID();
      const now = new Date();

      await db.insert(linkedServer).values({
        id,
        ...server,
        createdAt: now,
        linkedAt: server.state === 'linked' ? now : null,
        lastSeenAt: null,
      });

      const added = await readServer(id);

      if (added === null) {
        throw new Error(`linking: the server ${id} was not there after adding it`);
      }

      return added;
    },

    changeServer: async (id, change) => {
      const { linkedAt, lastSeenAt, ...rest } = change;

      await db
        .update(linkedServer)
        .set({
          ...rest,
          ...(linkedAt === undefined ? {} : { linkedAt }),
          ...(lastSeenAt === undefined ? {} : { lastSeenAt }),
        })
        .where(eq(linkedServer.id, id));

      return readServer(id);
    },

    removeServer: async (id) =>
      countAffected(await db.delete(linkedServer).where(eq(linkedServer.id, id))) > 0,

    listDeclined: async (id) => {
      const rows = await db
        .select({ libraryId: linkDecline.libraryId })
        .from(linkDecline)
        .where(eq(linkDecline.linkedServerId, id));

      return rows.map((row) => row.libraryId);
    },

    declineLibrary: async (id, libraryId, isDeclined) => {
      await db
        .delete(linkDecline)
        .where(and(eq(linkDecline.linkedServerId, id), eq(linkDecline.libraryId, libraryId)));

      if (isDeclined) {
        await db.insert(linkDecline).values({ linkedServerId: id, libraryId });
      }
    },
  };
};

export { createDatabaseLinkStore };
