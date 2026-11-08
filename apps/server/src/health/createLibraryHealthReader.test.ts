import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, linkedServer, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createLibraryHealthReader } from './createLibraryHealthReader';

const STARTING_DATABASE_MS = 60_000;

/**
 * A reader over a library of films on this server, holding one film twice, beside the films a
 * linked server shares, one of them a film this server has too and one never matched.
 *
 * @returns The reader.
 */
const aReader = async () => {
  const db = await aMigratedDatabase();

  await db.insert(linkedServer).values({
    id: 'friend',
    name: 'Friend',
    colour: 'blue',
    address: 'https://friend.example.com',
    publicKey: {},
    fingerprint: 'friend',
    state: 'linked',
  });
  await db.insert(library).values([
    { id: 'lib', name: 'Films', kind: 'movies', path: '/lib' },
    {
      id: 'theirs',
      name: 'Their films',
      kind: 'movies',
      path: 'linked://friend/api/libraries/1',
      linkedServerId: 'friend',
    },
  ]);
  await db.insert(mediaItem).values([
    { ...aMediaItemRow('matrix', 'lib'), title: 'The Matrix', externalId: '603' },
    { ...aMediaItemRow('heat', 'lib'), title: 'Heat', externalId: '949' },
    { ...aMediaItemRow('heat-again', 'lib'), title: 'Heat', externalId: '949' },
    { ...aMediaItemRow('their-matrix', 'theirs'), title: 'The Matrix', externalId: '603' },
    { ...aMediaItemRow('their-unknown', 'theirs'), title: 'Unknown', externalId: null },
  ]);

  return createLibraryHealthReader(db);
};

describe('createLibraryHealthReader', { timeout: STARTING_DATABASE_MS }, () => {
  it('counts a film twice only where both copies are on this server', async () => {
    const health = await (await aReader())();

    expect(health.duplicate.total).toBe(2);
    expect(health.duplicate.items.map((item) => item.id).toSorted()).toEqual([
      'heat',
      'heat-again',
    ]);
  });

  it('leaves a linked server’s films out of every list, since their files are not here', async () => {
    const health = await (await aReader())();
    const named = [
      ...health.unmatched.items,
      ...health.noArtwork.items,
      ...health.duplicate.items,
      ...health.unreadable.items,
    ].map((item) => item.id);

    expect(named.filter((id) => id.startsWith('their-'))).toEqual([]);
    expect(health.titles).toBe(3);
  });
});
