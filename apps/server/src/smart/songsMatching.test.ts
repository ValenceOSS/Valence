import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { favourite, favouriteArtist, hidden, mediaItem, musicPlay } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';
import { createDatabaseMusicStore } from '@ValenceServer/music/createDatabaseMusicStore';
import { songsMatching } from './songsMatching';
import type { SongRule, SongRules } from '@ValenceContracts/schemas/SmartRules';

const STARTING_POSTGRES_MS = 60_000;

const NOW = new Date('2026-10-27T12:00:00.000Z');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A moment some whole days before now.
 *
 * @param days - How many days.
 * @returns The moment.
 */
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

/**
 * A household with two albums of two songs each: a rock album from 1994 by an artist Pat follows,
 * in the library over a year, and a pop album from 2015 added this week. Pat likes the first song of
 * each, played the old album's first song once months ago and the new album's second three times
 * this week; Sam played the old album's second.
 *
 * @returns The database, Pat listening, and how to ask what a smart playlist holds.
 */
const aShelf = async () => {
  const household = await aHousehold();
  const { db } = household;
  const store = createDatabaseMusicStore(db);
  const low = await store.keepArtist('music', 'Low', null);
  const other = await store.keepArtist('music', 'Other', null);
  const old = await store.keepAlbum({
    libraryId: 'music',
    artistId: low.id,
    title: 'Old',
    year: 1994,
    genres: ['Rock'],
    isCompilation: false,
    musicbrainzId: null,
    releaseGroupMusicbrainzId: null,
  });
  const fresh = await store.keepAlbum({
    libraryId: 'music',
    artistId: other.id,
    title: 'New',
    year: 2015,
    genres: ['Pop'],
    isCompilation: false,
    musicbrainzId: null,
    releaseGroupMusicbrainzId: null,
  });
  const songs = [
    { title: 'Alpha', album: old.id, artist: low.id, trackNumber: 1, addedAt: daysAgo(400) },
    { title: 'Bravo', album: old.id, artist: low.id, trackNumber: 2, addedAt: daysAgo(400) },
    { title: 'Charlie', album: fresh.id, artist: other.id, trackNumber: 1, addedAt: daysAgo(5) },
    { title: 'Delta', album: fresh.id, artist: other.id, trackNumber: 2, addedAt: daysAgo(5) },
  ];
  const ids = new Map<string, string>();

  for (const song of songs) {
    const path = `/music/${song.title}.flac`;

    await store.keepTrack(
      aTrackRow({
        albumId: song.album,
        artistIds: [song.artist],
        path,
        title: song.title,
        trackNumber: song.trackNumber,
      }),
    );
    await db.update(mediaItem).set({ addedAt: song.addedAt }).where(eq(mediaItem.path, path));

    const [row] = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(eq(mediaItem.path, path));

    ids.set(row?.id ?? '', song.title);
  }

  const idOf = (title: string) => [...ids].find(([, named]) => named === title)?.[0] ?? '';

  await db.insert(favourite).values([
    { id: 'f1', profileId: 'pat', mediaItemId: idOf('Alpha') },
    { id: 'f2', profileId: 'pat', mediaItemId: idOf('Charlie') },
  ]);
  await db.insert(favouriteArtist).values({ profileId: 'pat', artistId: low.id });
  await db.insert(musicPlay).values([
    { id: 'm1', profileId: 'pat', trackId: idOf('Alpha'), playedAt: daysAgo(100) },
    { id: 'm2', profileId: 'pat', trackId: idOf('Delta'), playedAt: daysAgo(3) },
    { id: 'm3', profileId: 'pat', trackId: idOf('Delta'), playedAt: daysAgo(2) },
    { id: 'm4', profileId: 'pat', trackId: idOf('Delta'), playedAt: daysAgo(1) },
    { id: 'm5', profileId: 'sam', trackId: idOf('Bravo'), playedAt: daysAgo(1) },
  ]);

  /**
   * What a smart playlist with these rules holds for Pat, by title.
   *
   * @param rules - The playlist's rules, beyond its order and how many it holds.
   * @param profileId - Whose listening the rules read.
   * @returns What it holds, in order.
   */
  const holds = async (rules: Partial<SongRules>, profileId: string | null = 'pat') =>
    (
      await songsMatching(db, {
        listId: 'list',
        viewer: household.viewer,
        profileId,
        rules: { rules: [], order: 'title', limit: null, ...rules },
        now: NOW,
      })
    ).map((song) => ids.get(song.id));

  return { ...household, holds, idOf };
};

/**
 * What one rule lets into a smart playlist, by title.
 *
 * @param holds - How the shelf is asked.
 * @param rule - The rule.
 * @returns What it holds.
 */
const keeping = (
  holds: Awaited<ReturnType<typeof aShelf>>['holds'],
  rule: SongRule,
): Promise<(string | undefined)[]> => holds({ rules: [rule] });

describe('songsMatching', { timeout: STARTING_POSTGRES_MS }, () => {
  it('holds every song the viewer may hear and nothing that is not a song', async () => {
    const { holds } = await aShelf();

    await expect(holds({})).resolves.toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('keeps what the profile liked, or what it did not', async () => {
    const { holds } = await aShelf();

    await expect(keeping(holds, { kind: 'liked', is: true })).resolves.toEqual([
      'Alpha',
      'Charlie',
    ]);
    await expect(keeping(holds, { kind: 'liked', is: false })).resolves.toEqual(['Bravo', 'Delta']);
  });

  it('keeps songs by an artist the profile follows', async () => {
    const { holds } = await aShelf();

    await expect(keeping(holds, { kind: 'followedArtist', is: true })).resolves.toEqual([
      'Alpha',
      'Bravo',
    ]);
  });

  it('keeps a genre or keeps it out, and the years asked for, by the album', async () => {
    const { holds } = await aShelf();

    await expect(
      keeping(holds, { kind: 'genre', anyOf: ['Pop'], isNegated: false }),
    ).resolves.toEqual(['Charlie', 'Delta']);
    await expect(
      keeping(holds, { kind: 'genre', anyOf: ['Pop'], isNegated: true }),
    ).resolves.toEqual(['Alpha', 'Bravo']);
    await expect(keeping(holds, { kind: 'released', from: 1990, to: 1999 })).resolves.toEqual([
      'Alpha',
      'Bravo',
    ]);
  });

  it('keeps how often the profile played a song, never played among them', async () => {
    const { holds } = await aShelf();

    await expect(keeping(holds, { kind: 'plays', atLeast: 2, atMost: null })).resolves.toEqual([
      'Delta',
    ]);
    await expect(keeping(holds, { kind: 'plays', atLeast: null, atMost: 0 })).resolves.toEqual([
      'Bravo',
      'Charlie',
    ]);
  });

  it('keeps what was played lately, or what was not, never played among them', async () => {
    const { holds } = await aShelf();

    await expect(
      keeping(holds, { kind: 'lastPlayed', withinDays: 30, isNegated: false }),
    ).resolves.toEqual(['Delta']);
    await expect(
      keeping(holds, { kind: 'lastPlayed', withinDays: 30, isNegated: true }),
    ).resolves.toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('keeps what was added lately', async () => {
    const { holds } = await aShelf();

    await expect(keeping(holds, { kind: 'added', withinDays: 30 })).resolves.toEqual([
      'Charlie',
      'Delta',
    ]);
  });

  it('reads whose listening it is told to, and treats nobody as having liked or played nothing', async () => {
    const { holds } = await aShelf();

    await expect(
      holds({ rules: [{ kind: 'plays', atLeast: 1, atMost: null }] }, 'sam'),
    ).resolves.toEqual(['Bravo']);
    await expect(holds({ rules: [{ kind: 'liked', is: true }] }, null)).resolves.toEqual([]);
  });

  it('orders by plays, by when last played, by when added and by release', async () => {
    const { holds } = await aShelf();

    await expect(holds({ order: 'mostPlayed', limit: 2 })).resolves.toEqual(['Delta', 'Alpha']);
    await expect(holds({ order: 'lastPlayed', limit: 2 })).resolves.toEqual(['Delta', 'Alpha']);
    await expect(holds({ order: 'added' })).resolves.toEqual([
      'Charlie',
      'Delta',
      'Alpha',
      'Bravo',
    ]);
    await expect(holds({ order: 'released', limit: 1 })).resolves.toEqual(['Charlie']);
  });

  it('shuffles the same way all day, every song still coming once', async () => {
    const { holds } = await aShelf();
    const first = await holds({ order: 'random' });

    await expect(holds({ order: 'random' })).resolves.toEqual(first);
    expect([...first].sort()).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('leaves out what the viewer has hidden', async () => {
    const { db, holds, idOf } = await aShelf();

    await db.insert(hidden).values({ id: 'h1', profileId: 'pat', mediaItemId: idOf('Alpha') });

    await expect(holds({})).resolves.toEqual(['Bravo', 'Charlie', 'Delta']);
  });
});
