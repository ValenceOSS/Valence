import { describe, expect, it } from 'vitest';
import { playlist } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { dropPrivatePlaylistsOf } from './dropPrivatePlaylistsOf';

const STARTING_POSTGRES_MS = 60_000;

describe('dropPrivatePlaylistsOf', { timeout: STARTING_POSTGRES_MS }, () => {
  it('drops the private playlists of the profiles going, counting them, and keeps the shared', async () => {
    const { db } = await aHousehold();

    await db.insert(playlist).values([
      { id: 'mine', profileId: 'pat', name: 'Mine' },
      { id: 'also-mine', profileId: 'pat', name: 'Also mine' },
      { id: 'ours', profileId: 'pat', name: 'Ours', isShared: true },
      { id: 'hers', profileId: 'sam', name: 'Sam’s' },
    ]);

    await expect(dropPrivatePlaylistsOf(db, ['pat'])).resolves.toBe(2);

    const left = await db.select({ id: playlist.id }).from(playlist);

    expect(left.map((row) => row.id).sort()).toEqual(['hers', 'ours']);
  });

  it('drops nothing for nobody', async () => {
    const { db } = await aHousehold();

    await expect(dropPrivatePlaylistsOf(db, [])).resolves.toBe(0);
  });
});
