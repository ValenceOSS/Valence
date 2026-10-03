import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, linkedServer, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { fromLinkedServersOnly } from './fromLinkedServersOnly';

const STARTING_THE_DATABASE_MS = 60_000;

const aServer = (id: string, state: 'linked' | 'unlinked' | 'refused') => ({
  id,
  name: id,
  colour: '#e8503a',
  address: `https://${id}.example`,
  publicKey: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' },
  fingerprint: id,
  state,
});

describe('fromLinkedServersOnly', () => {
  it(
    'leaves out the libraries and titles of a server this one is no longer linked with',
    async () => {
      const db = await aMigratedDatabase();

      await db
        .insert(linkedServer)
        .values([
          aServer('films', 'linked'),
          aServer('gone', 'unlinked'),
          aServer('no', 'refused'),
        ]);
      await db.insert(library).values([
        { id: 'mine', name: 'Mine', kind: 'movies', path: '/m' },
        { id: 'theirs', name: 'Theirs', kind: 'movies', path: '/t', linkedServerId: 'films' },
        { id: 'kept', name: 'Kept', kind: 'movies', path: '/k', linkedServerId: 'gone' },
        { id: 'refused', name: 'Refused', kind: 'movies', path: '/r', linkedServerId: 'no' },
      ]);
      await db
        .insert(mediaItem)
        .values([
          aMediaItemRow('a', 'mine'),
          aMediaItemRow('b', 'theirs'),
          aMediaItemRow('c', 'kept'),
          aMediaItemRow('d', 'refused'),
        ]);

      const libraries = await db
        .select({ id: library.id })
        .from(library)
        .where(fromLinkedServersOnly(db, 'library'));
      const titles = await db
        .select({ id: mediaItem.id })
        .from(mediaItem)
        .where(fromLinkedServersOnly(db, 'item'));

      expect(libraries.map((row) => row.id).sort()).toEqual(['mine', 'theirs']);
      expect(titles.map((row) => row.id).sort()).toEqual(['a', 'b']);
    },
    STARTING_THE_DATABASE_MS,
  );
});
