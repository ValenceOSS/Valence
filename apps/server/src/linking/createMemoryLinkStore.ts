import { randomUUID } from 'node:crypto';
import type { LinkInvite } from '@ValenceContracts/schemas/LinkedServer';
import type { LinkStore, StoredLinkedServer } from './LinkStore';

type HeldInvite = LinkInvite & { codeHash: string; usedAt: string | null };

/**
 * Linked servers and invites held in memory, for tests and for a server started without a
 * database.
 *
 * @returns The store.
 */
const createMemoryLinkStore = (): LinkStore => {
  const invites = new Map<string, HeldInvite>();
  const servers = new Map<string, StoredLinkedServer>();
  const declined = new Map<string, Set<string>>();

  const isOpen = (invite: HeldInvite, now: Date) =>
    invite.usedAt === null && new Date(invite.expiresAt) > now;

  return {
    listInvites: (now) =>
      Promise.resolve(
        [...invites.values()]
          .filter((invite) => isOpen(invite, now))
          .map(({ id, createdAt, expiresAt }) => ({ id, createdAt, expiresAt })),
      ),
    addInvite: (codeHash, expiresAt) => {
      const invite: HeldInvite = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        codeHash,
        usedAt: null,
      };

      invites.set(invite.id, invite);

      return Promise.resolve({
        id: invite.id,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
      });
    },
    withdrawInvite: (id) => Promise.resolve(invites.delete(id)),
    spendInvite: (codeHash, now) => {
      const found = [...invites.values()].find(
        (invite) => invite.codeHash === codeHash && isOpen(invite, now),
      );

      if (found === undefined) {
        return Promise.resolve(false);
      }

      found.usedAt = now.toISOString();

      return Promise.resolve(true);
    },
    listServers: () => Promise.resolve([...servers.values()]),
    readServer: (id) => Promise.resolve(servers.get(id) ?? null),
    readServerByFingerprint: (fingerprint) =>
      Promise.resolve(
        [...servers.values()].find((server) => server.fingerprint === fingerprint) ?? null,
      ),
    addServer: (server) => {
      const made: StoredLinkedServer = {
        ...server,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        linkedAt: server.state === 'linked' ? new Date().toISOString() : null,
        lastSeenAt: null,
      };

      servers.set(made.id, made);

      return Promise.resolve(made);
    },
    changeServer: (id, change) => {
      const found = servers.get(id);

      if (found === undefined) {
        return Promise.resolve(null);
      }

      const { linkedAt, lastSeenAt, ...rest } = change;
      const changed: StoredLinkedServer = {
        ...found,
        ...rest,
        ...(linkedAt === undefined ? {} : { linkedAt: linkedAt?.toISOString() ?? null }),
        ...(lastSeenAt === undefined ? {} : { lastSeenAt: lastSeenAt.toISOString() }),
      };

      servers.set(id, changed);

      return Promise.resolve(changed);
    },
    removeServer: (id) => {
      declined.delete(id);

      return Promise.resolve(servers.delete(id));
    },

    listDeclined: (id) => Promise.resolve([...(declined.get(id) ?? [])]),

    declineLibrary: (id, libraryId, isDeclined) => {
      const held = declined.get(id) ?? new Set<string>();

      if (isDeclined) {
        held.add(libraryId);
      } else {
        held.delete(libraryId);
      }

      declined.set(id, held);

      return Promise.resolve();
    },
  };
};

export { createMemoryLinkStore };
