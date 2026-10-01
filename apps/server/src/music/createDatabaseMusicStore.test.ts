import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { mediaItem, musicTrack, musicTrackArtist } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';
import { createDatabaseMusicStore } from './createDatabaseMusicStore';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A music store over a fresh household, with one artist and one album of theirs already kept.
 *
 * @returns The store, its database, and the artist and album.
 */
const aStoreWithAnAlbum = async () => {
  const { db } = await aHousehold();
  const store = createDatabaseMusicStore(db);
  const artist = await store.keepArtist('music', 'Low', null);
  const album = await store.keepAlbum({
    libraryId: 'music',
    artistId: artist.id,
    title: 'Hey What',
    year: 2021,
    genres: ['slowcore'],
    isCompilation: false,
    musicbrainzId: null,
    releaseGroupMusicbrainzId: null,
  });

  return { db, store, artist, album };
};

describe('createDatabaseMusicStore', { timeout: STARTING_POSTGRES_MS }, () => {
  it('finds the same artist and album again rather than keeping them twice', async () => {
    const { store, artist, album } = await aStoreWithAnAlbum();

    await expect(store.keepArtist('music', 'low', 'mbid')).resolves.toEqual({
      id: artist.id,
      hasImage: false,
    });
    await expect(
      store.keepAlbum({
        libraryId: 'music',
        artistId: artist.id,
        title: 'hey what',
        year: 2021,
        genres: [],
        isCompilation: false,
        musicbrainzId: null,
        releaseGroupMusicbrainzId: null,
      }),
    ).resolves.toEqual({ id: album.id, hasArtwork: false, isCorrected: false });
  });

  it('keeps a song scanned twice as one, as the second scan found it', async () => {
    const { db, store, artist, album } = await aStoreWithAnAlbum();
    const song = aTrackRow({ albumId: album.id, path: '/music/a.flac', artistIds: [artist.id] });

    await store.keepTrack(song);
    await store.keepTrack({ ...song, title: 'Renamed', trackNumber: 2 });

    const items = await db.select().from(mediaItem).where(eq(mediaItem.libraryId, 'music'));
    const tracks = await db.select().from(musicTrack);
    const credits = await db.select().from(musicTrackArtist);

    expect(items.map((item) => item.title)).toEqual(['Renamed']);
    expect(tracks.map((track) => [track.mediaItemId, track.trackNumber])).toEqual([
      [items[0]?.id, 2],
    ]);
    expect(credits.map((credit) => credit.artistId)).toEqual([artist.id]);
  });

  it('keeps the words found on the web through a rescan that finds none', async () => {
    const { db, store, artist, album } = await aStoreWithAnAlbum();
    const song = aTrackRow({ albumId: album.id, path: '/music/a.flac', artistIds: [artist.id] });

    await store.keepTrack(song);
    await db.update(musicTrack).set({ lyrics: 'Found', lyricsLookedUpAt: new Date() });
    await store.keepTrack(song);

    const [track] = await db.select().from(musicTrack);

    expect(track?.lyrics).toBe('Found');
  });

  it('says whether an album was there to correct, or to forget the correction of', async () => {
    const { store, album } = await aStoreWithAnAlbum();

    await expect(store.correctAlbum(album.id, 'group', null)).resolves.toBe(true);
    await expect(store.correctAlbum('nothing', 'group', null)).resolves.toBe(false);
    await expect(store.forgetAlbumCorrection(album.id)).resolves.toBe(true);
    await expect(store.forgetAlbumCorrection('nothing')).resolves.toBe(false);
  });

  it('counts the songs removed by their paths', async () => {
    const { store, artist, album } = await aStoreWithAnAlbum();

    await store.keepTrack(
      aTrackRow({ albumId: album.id, path: '/music/a.flac', artistIds: [artist.id] }),
    );
    await store.keepTrack(
      aTrackRow({ albumId: album.id, path: '/music/b.flac', artistIds: [artist.id] }),
    );

    await expect(store.removeByPaths('music', ['/music/a.flac', '/music/gone.flac'])).resolves.toBe(
      1,
    );
    await expect(store.removeByPaths('music', [])).resolves.toBe(0);
  });

  it('names the first artist credited on a song still wanting its words', async () => {
    const { store, artist, album } = await aStoreWithAnAlbum();
    const guest = await store.keepArtist('music', 'Guest', null);

    await store.keepTrack(
      aTrackRow({ albumId: album.id, path: '/music/a.flac', artistIds: [artist.id, guest.id] }),
    );
    await store.keepTrack(
      aTrackRow({
        albumId: album.id,
        path: '/music/b.flac',
        artistIds: [guest.id],
        title: 'Guested',
      }),
    );

    const wanting = await store.songsWithoutLyrics('music', false);

    expect(wanting.map((song) => [song.title, song.artistName]).sort()).toEqual([
      ['A Song', 'Low'],
      ['Guested', 'Guest'],
    ]);
  });
});
