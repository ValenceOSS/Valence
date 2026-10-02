import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { createDatabaseLinkStore } from './createDatabaseLinkStore';

const STARTING_THE_DATABASE_MS = 60_000;

const A_KEY = { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' } as const;

describe('createDatabaseLinkStore', () => {
  it(
    'spends an open invite once, and never one that has run out',
    async () => {
      const store = createDatabaseLinkStore(await aMigratedDatabase());
      const now = new Date('2026-10-02T12:00:00.000Z');

      const open = await store.addInvite('open', new Date('2026-10-03T12:00:00.000Z'));

      await store.addInvite('gone', new Date('2026-10-01T12:00:00.000Z'));

      expect((await store.listInvites(now)).map((invite) => invite.id)).toEqual([open.id]);
      expect(await store.spendInvite('open', now)).toBe(true);
      expect(await store.spendInvite('open', now)).toBe(false);
      expect(await store.spendInvite('gone', now)).toBe(false);
      expect(await store.withdrawInvite(open.id)).toBe(true);
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'keeps a server with its key, finds it by fingerprint, changes and forgets it',
    async () => {
      const store = createDatabaseLinkStore(await aMigratedDatabase());
      const added = await store.addServer({
        name: 'Anime',
        colour: '#3a8ee8',
        address: 'https://anime.example',
        publicKey: A_KEY,
        fingerprint: 'abcd',
        state: 'awaitingThem',
        theirPairingId: '00000000-0000-4000-8000-000000000001',
      });

      expect(await store.readServerByFingerprint('abcd')).toEqual(added);
      expect(added.publicKey).toEqual(A_KEY);

      const seen = new Date('2026-10-02T12:00:00.000Z');
      const linked = await store.changeServer(added.id, {
        state: 'linked',
        linkedAt: seen,
        lastSeenAt: seen,
      });

      expect(linked).toMatchObject({
        state: 'linked',
        linkedAt: seen.toISOString(),
        lastSeenAt: seen.toISOString(),
      });
      expect(await store.removeServer(added.id)).toBe(true);
      expect(await store.readServer(added.id)).toBeNull();
    },
    STARTING_THE_DATABASE_MS,
  );
});
