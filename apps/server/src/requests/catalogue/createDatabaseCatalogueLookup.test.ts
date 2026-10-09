import { describe, expect, it } from 'vitest';
import { mediaItem, series } from '#dialect/Schema';
import { createDatabaseMusicStore } from '@ValenceServer/music/createDatabaseMusicStore';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseCatalogueLookup } from './createDatabaseCatalogueLookup';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseCatalogueLookup', { timeout: STARTING_POSTGRES_MS }, () => {
  it('finds a held album by its artist and title keys', async () => {
    const { db } = await aHousehold();
    const store = createDatabaseMusicStore(db);
    const artist = await store.keepArtist('music', 'Low', null);
    const album = await store.keepAlbum({
      libraryId: 'music',
      artistId: artist.id,
      title: 'Hey What',
      year: null,
      genres: [],
      isCompilation: false,
      musicbrainzId: null,
      releaseGroupMusicbrainzId: null,
    });

    const found = await createDatabaseCatalogueLookup(db).albumsNamed([
      'low/hey what',
      'low/missing',
    ]);

    expect([...found]).toEqual([['low/hey what', album.id]]);
  });

  it('counts the episodes held in each season, a double episode as two', async () => {
    const { db } = await aHousehold();
    const episode = {
      libraryId: 'films',
      seriesId: 'show',
      title: 'An Episode',
      sizeBytes: 1,
      modifiedAtMs: 0,
      container: 'mkv',
      durationSeconds: 1800,
      videoCodec: 'h264',
      videoRange: 'sdr',
      width: 1920,
      height: 1080,
      audioStreams: [],
      subtitleStreams: [],
    };

    await db.insert(series).values({
      id: 'show',
      libraryId: 'films',
      key: 'show',
      title: 'Show',
      externalId: '42',
    });
    await db.insert(mediaItem).values([
      { ...episode, id: 'e1', path: '/s1e1', seasonNumber: 1, episodeNumber: 1 },
      {
        ...episode,
        id: 'e2',
        path: '/s1e2',
        seasonNumber: 1,
        episodeNumber: 2,
        episodeNumberEnd: 3,
      },
      { ...episode, id: 'e4', path: '/s2e1', seasonNumber: 2, episodeNumber: 1 },
    ]);

    const held = await createDatabaseCatalogueLookup(db).episodesHeld('42');

    expect([...held].sort()).toEqual([
      [1, 3],
      [2, 1],
    ]);
  });

  it('lists every episode file of a series, leaving out its extras', async () => {
    const { db } = await aHousehold();
    const episode = {
      libraryId: 'films',
      seriesId: 'show',
      title: 'An Episode',
      sizeBytes: 1,
      modifiedAtMs: 0,
      container: 'mkv',
      durationSeconds: 1800,
      videoCodec: 'h264',
      videoRange: 'sdr',
      width: 1920,
      height: 1080,
      audioStreams: [],
      subtitleStreams: [],
    };

    await db.insert(series).values({
      id: 'show',
      libraryId: 'films',
      key: 'folder:/media/Show',
      title: 'Show',
      externalId: '42',
    });
    await db.insert(mediaItem).values([
      {
        ...episode,
        id: 'e1',
        path: '/media/Show/Season 1/a.mkv',
        seasonNumber: 1,
        episodeNumber: 1,
        episodeNumberEnd: 2,
      },
      {
        ...episode,
        id: 'x1',
        path: '/media/Show/Season 1/behind.mkv',
        seasonNumber: 1,
        episodeNumber: 3,
        extraKind: 'featurette',
      },
    ]);

    expect(await createDatabaseCatalogueLookup(db).seriesFiles('42')).toEqual([
      {
        libraryId: 'films',
        seriesId: 'show',
        seriesKey: 'folder:/media/Show',
        path: '/media/Show/Season 1/a.mkv',
        season: 1,
        episode: 1,
        lastEpisode: 2,
      },
    ]);
    expect(await createDatabaseCatalogueLookup(db).seriesFiles('43')).toEqual([]);
  });
});
