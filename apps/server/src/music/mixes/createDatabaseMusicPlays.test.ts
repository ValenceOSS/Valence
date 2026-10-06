import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';
import { createDatabaseMusicStore } from '@ValenceServer/music/createDatabaseMusicStore';
import { createDatabaseMusicPlays } from './createDatabaseMusicPlays';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A household with one song on its shelves, and a record of what is heard.
 *
 * @returns The record of hearings and the song.
 */
const aSongToHear = async () => {
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
    aTrackRow({
      albumId: album.id,
      artistIds: [artist.id],
      path: '/music/white horses.flac',
      title: 'White Horses',
      isExplicit: false,
      durationSeconds: 200,
      sizeBytes: 3_000_000,
    }),
  );
  const [item] = await db
    .select({ id: mediaItem.id })
    .from(mediaItem)
    .where(eq(mediaItem.path, '/music/white horses.flac'));

  return { plays: createDatabaseMusicPlays(db), trackId: item?.id ?? '' };
};

describe('createDatabaseMusicPlays', { timeout: STARTING_POSTGRES_MS }, () => {
  it('counts each hearing of a song, with when it was last heard', async () => {
    const { plays, trackId } = await aSongToHear();
    const before = Date.now() - 1_000;

    await plays.record('pat', trackId);
    await plays.record('pat', trackId);

    const [counted] = await plays.countsSince('pat', before);

    expect(counted).toMatchObject({ trackId, plays: 2 });
    expect(counted?.lastPlayedAtMs).toBeGreaterThanOrEqual(before);
  });

  it('leaves out what was heard before the time asked about, and other profiles’ hearing', async () => {
    const { plays, trackId } = await aSongToHear();

    await plays.record('pat', trackId);

    await expect(plays.countsSince('pat', Date.now() + 60_000)).resolves.toEqual([]);
    await expect(plays.countsSince('sam', 0)).resolves.toEqual([]);
  });
});
