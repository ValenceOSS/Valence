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
});
