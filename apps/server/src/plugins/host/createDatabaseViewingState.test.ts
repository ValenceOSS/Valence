import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  favourite,
  favouriteArtist,
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicPlay,
  musicTrack,
  rating,
  series,
  user,
  viewerProfile,
  watchHistory,
} from '#dialect/Schema';
import { createDatabaseViewingState } from './createDatabaseViewingState';

const FILM_KEPT_AT = '2026-09-30T08:00:00.000Z';

const BAND_KEPT_AT = '2026-09-29T19:30:00.000Z';

const STARTING_POSTGRES_MS = 60_000;

/**
 * An item as the scan would store it.
 *
 * @param id - The item.
 * @param libraryId - The library it is in.
 * @returns The row.
 */
const anItem = (id: string, libraryId: string): typeof mediaItem.$inferInsert => ({
  id,
  libraryId,
  path: `/${libraryId}/${id}`,
  title: id,
  sizeBytes: 1,
  modifiedAtMs: 1,
  container: 'mkv',
  durationSeconds: 60,
  videoCodec: 'h264',
  videoRange: 'sdr',
  width: 1920,
  height: 1080,
  audioStreams: [],
  subtitleStreams: [],
});

/**
 * One person who kept a film, rated a series, played a song twice, and finished a film once and
 * started it again, beside another who did none of it.
 *
 * @returns How a plugin reads where they stand.
 */
const aHousehold = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'adult', name: 'Adult', email: 'adult@example.com' });
  await db.insert(viewerProfile).values([
    { id: 'sam', userId: 'adult', name: 'Sam', colour: 'blue' },
    { id: 'alex', userId: 'adult', name: 'Alex', colour: 'green' },
  ]);
  await db.insert(library).values([
    { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
    { id: 'music', name: 'Music', kind: 'music', path: '/music' },
    { id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' },
  ]);
  await db.insert(series).values({ id: 'show', libraryId: 'shows', key: 'show', title: 'Show' });
  await db.insert(mediaItem).values([anItem('film', 'films'), anItem('song', 'music')]);
  await db.insert(musicArtist).values({
    id: 'band',
    libraryId: 'music',
    name: 'Band',
    nameKey: 'band',
    sortName: 'Band',
  });
  await db.insert(musicAlbum).values({
    id: 'album',
    libraryId: 'music',
    artistId: 'band',
    title: 'Album',
    titleKey: 'album',
  });
  await db.insert(musicTrack).values({ mediaItemId: 'song', albumId: 'album', codec: 'flac' });
  await db
    .insert(favourite)
    .values({ id: 'f1', profileId: 'sam', mediaItemId: 'film', keptAt: new Date(FILM_KEPT_AT) });
  await db
    .insert(favouriteArtist)
    .values({ profileId: 'sam', artistId: 'band', keptAt: new Date(BAND_KEPT_AT) });
  await db.insert(rating).values({ id: 'r1', profileId: 'sam', seriesId: 'show', stars: 4 });
  await db.insert(musicPlay).values([
    { id: 'p1', profileId: 'sam', trackId: 'song', playedAt: new Date('2026-10-01T10:00:00Z') },
    { id: 'p2', profileId: 'sam', trackId: 'song', playedAt: new Date('2026-10-03T10:00:00Z') },
  ]);
  await db.insert(watchHistory).values([
    {
      id: 'w1',
      profileId: 'sam',
      mediaItemId: 'film',
      lastWatchedAt: new Date('2026-10-02T21:00:00Z'),
      isFinished: true,
    },
    {
      id: 'w2',
      profileId: 'sam',
      mediaItemId: 'film',
      lastWatchedAt: new Date('2026-10-04T21:00:00Z'),
      isFinished: false,
    },
  ]);

  return createDatabaseViewingState(db);
};

describe('createDatabaseViewingState', { timeout: STARTING_POSTGRES_MS }, () => {
  it('reads what a person kept and when, rated and played, for each thing asked about', async () => {
    const state = await aHousehold();

    await expect(state('sam', ['film', 'song', 'show', 'band', 'nothing'])).resolves.toEqual([
      {
        mediaId: 'film',
        isFavourite: true,
        favouritedAt: FILM_KEPT_AT,
        stars: null,
        plays: 1,
        lastPlayedAt: '2026-10-02T21:00:00.000Z',
      },
      {
        mediaId: 'song',
        isFavourite: false,
        favouritedAt: null,
        stars: null,
        plays: 2,
        lastPlayedAt: '2026-10-03T10:00:00.000Z',
      },
      {
        mediaId: 'show',
        isFavourite: false,
        favouritedAt: null,
        stars: 4,
        plays: 0,
        lastPlayedAt: null,
      },
      {
        mediaId: 'band',
        isFavourite: true,
        favouritedAt: BAND_KEPT_AT,
        stars: null,
        plays: 0,
        lastPlayedAt: null,
      },
      {
        mediaId: 'nothing',
        isFavourite: false,
        favouritedAt: null,
        stars: null,
        plays: 0,
        lastPlayedAt: null,
      },
    ]);
  });

  it('reads only the person asked about', async () => {
    const state = await aHousehold();

    await expect(state('alex', ['film', 'song'])).resolves.toEqual([
      {
        mediaId: 'film',
        isFavourite: false,
        favouritedAt: null,
        stars: null,
        plays: 0,
        lastPlayedAt: null,
      },
      {
        mediaId: 'song',
        isFavourite: false,
        favouritedAt: null,
        stars: null,
        plays: 0,
        lastPlayedAt: null,
      },
    ]);
    await expect(state('sam', [])).resolves.toEqual([]);
  });

  it('answers once for an id asked about twice, and counts only viewings that were finished', async () => {
    const state = await aHousehold();

    await expect(state('sam', ['film', 'film'])).resolves.toEqual([
      {
        mediaId: 'film',
        isFavourite: true,
        favouritedAt: FILM_KEPT_AT,
        stars: null,
        plays: 1,
        lastPlayedAt: '2026-10-02T21:00:00.000Z',
      },
    ]);
  });
});
