import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { mediaItem } from '#dialect/Schema';
import { createDatabaseMusicService } from '@ValenceServer/music/createDatabaseMusicService';
import { createDatabaseMusicStore } from '@ValenceServer/music/createDatabaseMusicStore';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';
import { createDatabasePlaylistService } from './createDatabasePlaylistService';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A household with a film and two songs, only one of whose albums has a cover, and Pat's playlist
 * holding all three.
 *
 * @returns The playlist service, the database, Pat watching, the playlist and the covered album.
 */
const aPlaylist = async () => {
  const { db, viewer } = await aHousehold();
  const store = createDatabaseMusicStore(db);
  const artist = await store.keepArtist('music', 'Low', null);
  const album = async (title: string) =>
    (
      await store.keepAlbum({
        libraryId: 'music',
        artistId: artist.id,
        title,
        year: null,
        genres: [],
        isCompilation: false,
        musicbrainzId: null,
        releaseGroupMusicbrainzId: null,
      })
    ).id;
  const covered = await album('Covered');
  const bare = await album('Bare');

  await store.setAlbumArtwork(covered, '/art/covered.jpg');
  await store.keepTrack(aTrackRow({ albumId: covered, artistIds: [artist.id], path: '/music/a' }));
  await store.keepTrack(aTrackRow({ albumId: bare, artistIds: [artist.id], path: '/music/b' }));

  const songs = await db
    .select({ id: mediaItem.id })
    .from(mediaItem)
    .where(eq(mediaItem.libraryId, 'music'));
  const playlists = createDatabasePlaylistService(db, createDatabaseMusicService(db), '/artwork');
  const made = await playlists.create(viewer, {
    name: 'Evening',
    mediaItemIds: ['film', ...songs.map((song) => song.id)],
  });

  return { db, viewer, playlists, id: made?.id ?? '', covered };
};

describe('createDatabasePlaylistService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('tallies its entries and their length as numbers, tiled with only the covered albums', async () => {
    const { viewer, playlists, id, covered } = await aPlaylist();

    const [summary] = await playlists.list(viewer);

    expect(summary).toMatchObject({
      id,
      entryCount: 3,
      lostCount: 0,
      durationSeconds: 5400 + 240 + 240,
      artworkAlbumIds: [covered],
    });
  });

  it('counts the entries whose media has gone', async () => {
    const { db, viewer, playlists } = await aPlaylist();

    await db.delete(mediaItem).where(eq(mediaItem.id, 'film'));

    const [summary] = await playlists.list(viewer);

    expect(summary).toMatchObject({ entryCount: 2, lostCount: 1, durationSeconds: 480 });
  });

  it('says whether there was an entry to drop', async () => {
    const { viewer, playlists, id } = await aPlaylist();
    const read = await playlists.read(viewer, id);
    const entryId = read?.entries[0]?.id ?? '';

    await expect(playlists.drop(viewer, id, entryId)).resolves.toBe(true);
    await expect(playlists.drop(viewer, id, entryId)).resolves.toBe(false);
  });
});
