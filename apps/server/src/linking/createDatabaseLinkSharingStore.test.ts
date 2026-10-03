import { describe, expect, it } from 'vitest';
import { NOTHING_SHARED } from '@ValenceContracts/constants/NOTHING_SHARED';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library } from '#dialect/Schema';
import { createDatabaseLinkStore } from './createDatabaseLinkStore';
import { createDatabaseLinkSharingStore } from './createDatabaseLinkSharingStore';

const STARTING_THE_DATABASE_MS = 60_000;

const AT = new Date('2026-10-02T12:00:00.000Z');

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const ANIME = '00000000-0000-4000-8000-0000000000a1';

/**
 * A database with two libraries and one linked server.
 *
 * @returns The stores, and the linked server's id.
 */
const aLinkedDatabase = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values([
    { id: FILMS, name: 'Films', kind: 'movies', path: '/films' },
    { id: ANIME, name: 'Anime', kind: 'shows', path: '/anime' },
  ]);

  const links = createDatabaseLinkStore(db);
  const server = await links.addServer({
    name: 'Kai’s Valence',
    colour: '#3a8ee8',
    address: 'https://kai.example',
    publicKey: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' },
    fingerprint: 'abcd',
    state: 'linked',
    theirPairingId: null,
  });

  return { links, store: createDatabaseLinkSharingStore(db), serverId: server.id };
};

describe('createDatabaseLinkSharingStore', () => {
  it(
    'shares nothing at first, then replaces the whole choice of libraries at once',
    async () => {
      const { store, serverId } = await aLinkedDatabase();

      expect(await store.readSharing(serverId)).toEqual(NOTHING_SHARED);

      await store.changeSharing(serverId, { libraryIds: [FILMS, ANIME, FILMS], maximumAge: 12 });

      expect(await store.changeSharing(serverId, { libraryIds: [ANIME] })).toMatchObject({
        libraryIds: [ANIME],
        maximumAge: 12,
      });
      expect(await store.readSharing('00000000-0000-4000-8000-000000000000')).toBeNull();
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'keeps people and their record, and forgets both with the server',
    async () => {
      const { links, store, serverId } = await aLinkedDatabase();
      const sam = await store.seePerson(serverId, 'p1', 'Sam', AT);
      const again = await store.seePerson(serverId, 'p1', null, new Date(AT.getTime() + 1000));
      const entry = {
        linkedServerId: serverId,
        remotePersonId: sam.id,
        action: 'media',
        mediaId: FILMS,
        mediaTitle: 'Arrival',
        outcome: 'allowed',
      } as const;

      expect(again).toMatchObject({ id: sam.id, name: 'Sam' });
      expect((await store.blockPerson(serverId, sam.id, AT))?.blockedAt).toBe(AT.toISOString());

      await store.record(entry, AT);
      await store.record(entry, new Date(AT.getTime() + 10_000));

      expect(await store.listActivity(serverId, { limit: 10 })).toEqual([
        expect.objectContaining({ personName: 'Sam', mediaTitle: 'Arrival', count: 2 }),
      ]);

      await links.removeServer(serverId);

      expect(await store.listPeople(serverId)).toEqual([]);
      expect(await store.listActivity(serverId, { limit: 10 })).toEqual([]);
    },
    STARTING_THE_DATABASE_MS,
  );
});
