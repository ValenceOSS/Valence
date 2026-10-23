import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { mediaItem } from '#dialect/Schema';
import { createDatabaseFavouriteService } from '@ValenceServer/favourites/createDatabaseFavouriteService';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';
import { createDatabaseMusicService } from './createDatabaseMusicService';
import { createDatabaseMusicStore } from './createDatabaseMusicStore';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A household with two artists on its shelves: Low, with a new album, an old one and one of no
 * known year, each with a cover, and Other, whose one album shares a genre with Low's newest.
 *
 * @returns The music service, the database, Pat watching, and what was kept.
 */
const aShelf = async () => {
  const { db, viewer } = await aHousehold();
  const store = createDatabaseMusicStore(db);
  const low = await store.keepArtist('music', 'Low', null);
  const other = await store.keepArtist('music', 'Other', null);
  const album = async (artistId: string, title: string, year: number | null, genres: string[]) => {
    const kept = await store.keepAlbum({
      libraryId: 'music',
      artistId,
      title,
      year,
      genres,
      isCompilation: false,
      musicbrainzId: null,
      releaseGroupMusicbrainzId: null,
    });

    await store.setAlbumArtwork(kept.id, `/art/${title}.jpg`);

    return kept.id;
  };
  const newest = await album(low.id, 'Hey What', 2021, ['slowcore']);
  const oldest = await album(low.id, 'Things We Lost', 2001, ['indie']);
  const undated = await album(low.id, 'Undated', null, []);
  const others = await album(other.id, 'Elsewhere 100%', 2020, ['slowcore']);
  const song = async (albumId: string, artistId: string, path: string, isExplicit = false) => {
    await store.keepTrack(
      aTrackRow({
        albumId,
        artistIds: [artistId],
        path,
        title: path,
        isExplicit,
        durationSeconds: 200,
        sizeBytes: 3_000_000_000,
      }),
    );
    const [item] = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(eq(mediaItem.path, path));

    return item?.id ?? '';
  };
  const seed = await song(newest, low.id, '/music/white horses.flac', true);

  await song(newest, low.id, '/music/days like these.flac');
  await song(oldest, low.id, '/music/embrace.flac');
  await song(undated, low.id, '/music/nothing.flac');
  const kin = await song(others, other.id, '/music/kin.flac');

  return {
    db,
    viewer,
    music: createDatabaseMusicService(db),
    low: low.id,
    other: other.id,
    newest,
    seed,
    kin,
  };
};

describe('createDatabaseMusicService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('tallies an album’s songs, length and size as numbers, and whether any is explicit', async () => {
    const { viewer, music, newest } = await aShelf();

    const albums = await music.listAlbums(viewer);
    const hey = albums.find((album) => album.id === newest);
    const others = albums.find((album) => album.title === 'Elsewhere 100%');

    expect(hey).toMatchObject({
      trackCount: 2,
      durationSeconds: 400,
      sizeBytes: 6_000_000_000,
      isExplicit: true,
    });
    expect(others).toMatchObject({ trackCount: 1, isExplicit: false });
  });

  it('counts and lists only the songs still there, and an artist only while one of theirs is', async () => {
    const { db, viewer, music, newest, seed, kin } = await aShelf();
    const gone = new Date('2026-10-01T00:00:00.000Z');

    await db.update(mediaItem).set({ missingSince: gone }).where(eq(mediaItem.id, seed));
    await db.update(mediaItem).set({ missingSince: gone }).where(eq(mediaItem.id, kin));

    const albums = await music.listAlbums(viewer);
    const artists = await music.listArtists(viewer);

    expect(albums.find((album) => album.id === newest)).toMatchObject({
      trackCount: 1,
      durationSeconds: 200,
      sizeBytes: 3_000_000_000,
      isExplicit: false,
    });
    expect(albums.map((album) => album.title)).not.toContain('Elsewhere 100%');
    expect(artists.map((artist) => artist.name)).toEqual(['Low']);
    expect(artists[0]).toMatchObject({ albumCount: 3, trackCount: 3 });
  });

  it('lists no artist whose own albums have all gone missing, though they guest on another', async () => {
    const { db, viewer, music } = await aShelf();
    const store = createDatabaseMusicStore(db);
    const guest = await store.keepArtist('music', 'Guest', null);
    const [lowAlbum] = await music.listAlbums(viewer, { order: 'title' });
    const theirs = await store.keepAlbum({
      libraryId: 'music',
      artistId: guest.id,
      title: 'Their Own',
      year: null,
      genres: [],
      isCompilation: false,
      musicbrainzId: null,
      releaseGroupMusicbrainzId: null,
    });

    await store.keepTrack(
      aTrackRow({ albumId: theirs.id, artistIds: [guest.id], path: '/music/their own.flac' }),
    );
    await store.keepTrack(
      aTrackRow({
        albumId: lowAlbum?.id ?? '',
        artistIds: [guest.id],
        path: '/music/guest spot.flac',
      }),
    );
    await store.setAside('music', ['/music/their own.flac'], new Date('2026-10-01T00:00:00.000Z'));

    expect((await music.listArtists(viewer)).map((artist) => artist.name)).not.toContain('Guest');
  });

  it('lists albums and artists a page at a time, each page carrying on where the last stopped', async () => {
    const { viewer, music } = await aShelf();

    const albums = await music.listAlbums(viewer, { order: 'title' });
    const albumPages = [
      ...(await music.listAlbums(viewer, { order: 'title', limit: 3 })),
      ...(await music.listAlbums(viewer, { order: 'title', limit: 3, offset: 3 })),
    ];
    const artists = await music.listArtists(viewer);
    const artistPages = [
      ...(await music.listArtists(viewer, { limit: 1 })),
      ...(await music.listArtists(viewer, { limit: 1, offset: 1 })),
    ];

    expect(albums).toHaveLength(4);
    expect(albumPages.map((album) => album.id)).toEqual(albums.map((album) => album.id));
    expect(artists).toHaveLength(2);
    expect(artistPages.map((artist) => artist.id)).toEqual(artists.map((artist) => artist.id));
  });

  it('counts an artist’s albums and songs, and pictures them by their newest dated cover', async () => {
    const { viewer, music, low, newest } = await aShelf();

    const artists = await music.listArtists(viewer);

    expect(artists.find((artist) => artist.id === low)).toMatchObject({
      albumCount: 3,
      trackCount: 4,
      imageAlbumId: newest,
      isFavourite: false,
    });
  });

  it('follows an artist once, and says whether there was one to follow or unfollow', async () => {
    const { viewer, music, low } = await aShelf();

    await expect(music.keepArtist('pat', low)).resolves.toBe(true);
    await expect(music.keepArtist('pat', low)).resolves.toBe(true);
    await expect(music.keepArtist('pat', 'nobody')).resolves.toBe(false);

    const followed = await music.listArtists(viewer, { onlyFavourites: true });

    expect(followed.map((artist) => [artist.id, artist.isFavourite])).toEqual([[low, true]]);
    await expect(music.dropArtist('pat', low)).resolves.toBe(true);
    await expect(music.dropArtist('pat', low)).resolves.toBe(false);
  });

  it('searches whatever the case, and takes a % as written', async () => {
    const { viewer, music, low } = await aShelf();

    const found = await music.search(viewer, 'HEY');
    const literal = await music.search(viewer, '100%');
    const wild = await music.search(viewer, 'l_w');

    expect(found.albums.map((album) => album.title)).toEqual(['Hey What']);
    expect(literal.albums.map((album) => album.title)).toEqual(['Elsewhere 100%']);
    expect((await music.search(viewer, 'low')).artists.map((artist) => artist.id)).toEqual([low]);
    expect(wild.artists).toEqual([]);
  });

  it('picks songs sharing a genre with the ones played', async () => {
    const { viewer, music, seed, kin } = await aShelf();

    const picks = await music.listPicks(viewer, [seed], 20);

    expect(picks.map((track) => track.id)).toContain(kin);
    expect(picks.map((track) => track.id)).not.toContain(seed);
  });

  it('lists what was liked, the latest first', async () => {
    const { db, viewer, music, seed, kin } = await aShelf();
    const favourites = createDatabaseFavouriteService(db);

    await favourites.keep('pat', kin);
    await new Promise((settle) => setTimeout(settle, 5));
    await favourites.keep('pat', seed);

    const liked = await music.listLiked(viewer);

    expect(liked.map((track) => track.id)).toEqual([seed, kin]);
  });

  it('lists every song that may be heard, with its album’s year, genres and cover, and who made it', async () => {
    const { viewer, music, low, newest, seed } = await aShelf();

    const songs = await music.listCatalogue(viewer);
    const white = songs.find((song) => song.id === seed);

    expect(songs).toHaveLength(5);
    expect(white).toEqual({
      id: seed,
      albumId: newest,
      hasArtwork: true,
      year: 2021,
      genres: ['slowcore'],
      artists: [{ id: low, name: 'Low' }],
    });
  });
});
