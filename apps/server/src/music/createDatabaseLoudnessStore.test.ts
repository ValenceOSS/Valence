import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { mediaItem, musicTrack } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';
import { createDatabaseLoudnessStore } from './createDatabaseLoudnessStore';
import { createDatabaseMusicStore } from './createDatabaseMusicStore';

const STARTING_POSTGRES_MS = 60_000;

const NOW = new Date('2026-10-27T12:00:00Z');

/**
 * A loudness store over a fresh household holding one album of two songs and a song from a linked
 * server.
 *
 * @returns The store, its database, the album and the songs' ids.
 */
const anAlbumOfTwo = async () => {
  const { db } = await aHousehold();
  const music = createDatabaseMusicStore(db);
  const artist = await music.keepArtist('music', 'Low', null);
  const album = await music.keepAlbum({
    libraryId: 'music',
    artistId: artist.id,
    title: 'Hey What',
    year: 2021,
    genres: [],
    isCompilation: false,
    musicbrainzId: null,
    releaseGroupMusicbrainzId: null,
  });

  for (const path of [
    '/music/one.flac',
    '/music/two.flac',
    'linked://00000000-0000-4000-8000-000000000001/api/music/tracks/x/stream',
  ]) {
    await music.keepTrack(aTrackRow({ albumId: album.id, artistIds: [artist.id], path }));
  }

  const idOf = async (path: string) =>
    (await db.select({ id: mediaItem.id }).from(mediaItem).where(eq(mediaItem.path, path)))[0]
      ?.id ?? '';

  return {
    db,
    store: createDatabaseLoudnessStore(db),
    album,
    one: await idOf('/music/one.flac'),
    two: await idOf('/music/two.flac'),
  };
};

describe('createDatabaseLoudnessStore', { timeout: STARTING_POSTGRES_MS }, () => {
  it('lists the songs here still waiting to be measured, leaving linked ones alone', async () => {
    const { store } = await anAlbumOfTwo();

    expect((await store.waiting()).map((track) => track.path).sort()).toEqual([
      '/music/one.flac',
      '/music/two.flac',
    ]);
  });

  it('keeps a measurement and stops listing the song', async () => {
    const { db, store, one } = await anAlbumOfTwo();

    await store.keepMeasured(one, { trackGainDb: -6, trackPeak: 0.9 }, NOW);

    const [kept] = await db.select().from(musicTrack).where(eq(musicTrack.mediaItemId, one));

    expect(kept).toMatchObject({ trackGainDb: -6, trackPeak: 0.9 });
    expect((await store.waiting()).map((track) => track.id)).not.toContain(one);
  });

  it('does not list a song again that had nothing to hear', async () => {
    const { store, one } = await anAlbumOfTwo();

    await store.keepMeasured(one, null, NOW);

    expect((await store.waiting()).map((track) => track.id)).not.toContain(one);
  });

  it('offers an album to level only once every song in it is measured', async () => {
    const { store, album, one, two } = await anAlbumOfTwo();

    await store.keepMeasured(one, { trackGainDb: -6, trackPeak: 0.9 }, NOW);

    expect(await store.albumsToLevel()).toEqual([]);

    await store.keepMeasured(two, { trackGainDb: -4, trackPeak: 1 }, NOW);

    expect(await store.albumsToLevel()).toEqual([expect.objectContaining({ albumId: album.id })]);
  });

  it('keeps an album’s gain on every song in it, and offers it no more', async () => {
    const { db, store, album, one, two } = await anAlbumOfTwo();

    await store.keepMeasured(one, { trackGainDb: -6, trackPeak: 0.9 }, NOW);
    await store.keepMeasured(two, { trackGainDb: -4, trackPeak: 1 }, NOW);
    await store.keepAlbum(album.id, -5, 1);

    const kept = await db.select().from(musicTrack).where(eq(musicTrack.albumId, album.id));

    expect(kept.every((row) => row.albumGainDb === -5 && row.albumPeak === 1)).toBe(true);
    expect(await store.albumsToLevel()).toEqual([]);
  });
});
