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

  return { db, viewer, playlists, store, artist, bare, id: made?.id ?? '', covered };
};

describe('createDatabasePlaylistService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('tallies its entries and their length as numbers, tiled with only the covered albums', async () => {
    const { viewer, playlists, id, covered } = await aPlaylist();

    const [summary] = await playlists.list(viewer);

    expect(summary).toMatchObject({
      id,
      entryCount: 3,
      lostCount: 0,
      missingCount: 0,
      durationSeconds: 5400 + 240 + 240,
      artworkAlbumIds: [covered],
    });
  });

  it('counts the entries whose media has gone', async () => {
    const { db, viewer, playlists } = await aPlaylist();

    await db.delete(mediaItem).where(eq(mediaItem.id, 'film'));

    const [summary] = await playlists.list(viewer);

    expect(summary).toMatchObject({
      entryCount: 2,
      lostCount: 1,
      missingCount: 0,
      durationSeconds: 480,
    });
  });

  it('says whether there was an entry to drop', async () => {
    const { viewer, playlists, id } = await aPlaylist();
    const read = await playlists.read(viewer, id);
    const entryId = read?.entries[0]?.id ?? '';

    await expect(playlists.drop(viewer, id, entryId)).resolves.toBe(true);
    await expect(playlists.drop(viewer, id, entryId)).resolves.toBe(false);
  });

  it('keeps a song the library does not have in its place, counted apart from what has gone', async () => {
    const { db, viewer, playlists, id } = await aPlaylist();

    await playlists.add(viewer, id, [
      { title: 'Nowhere Yet', artist: 'Low', album: null, releaseId: null },
      {
        title: 'Far Off',
        artist: 'Low',
        album: 'Distant',
        releaseId: '959621bf-6536-4f37-a60d-148168d98700',
      },
    ]);
    await db.delete(mediaItem).where(eq(mediaItem.id, 'film'));

    const [summary] = await playlists.list(viewer);
    const read = await playlists.read(viewer, id);

    expect(summary).toMatchObject({ entryCount: 2, lostCount: 1, missingCount: 2 });
    expect(read?.entries.map((entry) => [entry.item?.title ?? null, entry.missing])).toEqual([
      [null, null],
      ['A Song', null],
      ['A Song', null],
      [
        null,
        {
          title: 'Nowhere Yet',
          artist: 'Low',
          album: null,
          releaseId: null,
          coverUrl: '/api/music/catalogue/named-covers?title=Nowhere+Yet&artist=Low',
        },
      ],
      [
        null,
        {
          title: 'Far Off',
          artist: 'Low',
          album: 'Distant',
          releaseId: '959621bf-6536-4f37-a60d-148168d98700',
          coverUrl:
            '/api/music/catalogue/release-covers/959621bf-6536-4f37-a60d-148168d98700?title=Distant&artist=Low',
        },
      ],
    ]);
  });

  it('fills a missing song in where it stands once the library has it, for its owner', async () => {
    const { viewer, playlists, store, artist, bare, id } = await aPlaylist();

    await playlists.add(viewer, id, [
      { title: 'later arrival', artist: 'LOW', album: 'Bare', releaseId: null },
      { title: 'Still Away', artist: 'Low', album: null, releaseId: null },
    ]);
    await store.keepTrack(
      aTrackRow({
        albumId: bare,
        artistIds: [artist.id],
        path: '/music/c',
        title: 'Later Arrival',
      }),
    );

    const read = await playlists.read(viewer, id);

    expect(read?.entries.map((entry) => entry.item?.title ?? entry.missing?.title)).toEqual([
      'A Film',
      'A Song',
      'A Song',
      'Later Arrival',
      'Still Away',
    ]);
    expect(read?.playlist.missingCount).toBe(1);
  });

  it('looks for missing songs again only once the library has changed', async () => {
    const { viewer, playlists, store, artist, bare, id } = await aPlaylist();

    await playlists.add(viewer, id, [
      { title: 'Later Arrival', artist: 'Low', album: null, releaseId: null },
    ]);
    await playlists.read(viewer, id);
    await store.keepTrack(
      aTrackRow({
        albumId: bare,
        artistIds: [artist.id],
        path: '/music/c',
        title: 'Later Arrival',
      }),
    );

    const read = await playlists.read(viewer, id);

    expect(read?.entries.at(-1)?.item?.title).toBe('Later Arrival');
    expect(read?.playlist.missingCount).toBe(0);
  });

  it('leaves a missing song missing when somebody else reads the playlist', async () => {
    const { viewer, playlists, store, artist, bare, id } = await aPlaylist();

    await playlists.add(viewer, id, [
      { title: 'Later Arrival', artist: 'Low', album: null, releaseId: null },
    ]);
    await playlists.update(viewer, id, { isShared: true });
    await store.keepTrack(
      aTrackRow({
        albumId: bare,
        artistIds: [artist.id],
        path: '/music/c',
        title: 'Later Arrival',
      }),
    );

    const read = await playlists.read({ ...viewer, profileId: 'sam' }, id);

    expect(read?.entries.at(-1)?.missing).toMatchObject({
      title: 'Later Arrival',
      artist: 'Low',
      album: null,
    });
  });
});
