import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { favouriteArtist, mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';
import { createDatabaseMusicStore } from './createDatabaseMusicStore';
import { isByAFollowedArtist } from './isByAFollowedArtist';

const STARTING_POSTGRES_MS = 60_000;

describe('isByAFollowedArtist', { timeout: STARTING_POSTGRES_MS }, () => {
  it('holds for a song by an artist one profile follows, and not for another profile', async () => {
    const { db } = await aHousehold();
    const store = createDatabaseMusicStore(db);
    const artist = await store.keepArtist('music', 'Low', null);
    const album = await store.keepAlbum({
      libraryId: 'music',
      artistId: artist.id,
      title: 'Hey What',
      year: 2021,
      genres: [],
      isCompilation: false,
      musicbrainzId: null,
      releaseGroupMusicbrainzId: null,
    });

    await store.keepTrack(
      aTrackRow({ albumId: album.id, artistIds: [artist.id], path: '/music/a' }),
    );
    await db.insert(favouriteArtist).values({ profileId: 'pat', artistId: artist.id });

    const song = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(eq(mediaItem.path, '/music/a'));

    await expect(
      db.select({ id: mediaItem.id }).from(mediaItem).where(isByAFollowedArtist(db, 'pat')),
    ).resolves.toEqual(song);
    await expect(
      db.select({ id: mediaItem.id }).from(mediaItem).where(isByAFollowedArtist(db, 'sam')),
    ).resolves.toEqual([]);
  });
});
