import { describe, expect, it } from 'vitest';
import { createDatabaseMusicStore } from '@ValenceServer/music/createDatabaseMusicStore';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';
import { createDatabaseRequestedAlbumStore } from './createDatabaseRequestedAlbumStore';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A music library holding an album of a release group whose files have gone missing, and another
 * of the same group that has just arrived in its own folder.
 *
 * @returns The store and the two albums.
 */
const anOldAndANewCopy = async () => {
  const { db } = await aHousehold();
  const music = createDatabaseMusicStore(db);
  const artist = await music.keepArtist('music', 'Someone', null);
  const album = async (title: string) =>
    (
      await music.keepAlbum({
        libraryId: 'music',
        artistId: artist.id,
        title,
        year: null,
        genres: [],
        isCompilation: false,
        musicbrainzId: null,
        releaseGroupMusicbrainzId: 'group',
      })
    ).id;
  const old = await album('Old Pressing');
  const fresh = await album('New Pressing');

  await music.keepTrack(
    aTrackRow({ albumId: old, path: '/music/old/1.flac', artistIds: [artist.id] }),
  );
  await music.keepTrack(
    aTrackRow({ albumId: fresh, path: '/music/new/1.flac', artistIds: [artist.id] }),
  );
  await music.setAside('music', ['/music/old/1.flac'], new Date('2026-10-01T00:00:00.000Z'));

  return { store: createDatabaseRequestedAlbumStore(db), old, fresh };
};

describe('createDatabaseRequestedAlbumStore', { timeout: STARTING_POSTGRES_MS }, () => {
  it('ties a request to the copy that is there, never one whose files have gone missing', async () => {
    const { store, fresh } = await anOldAndANewCopy();

    await expect(store.findByReleaseGroup('music', 'group')).resolves.toBe(fresh);
  });

  it('finds nothing in a folder whose files have all gone missing', async () => {
    const { store, fresh } = await anOldAndANewCopy();

    await expect(store.findUnder('music', '/music/old')).resolves.toBeNull();
    await expect(store.findUnder('music', '/music/new')).resolves.toBe(fresh);
  });
});
