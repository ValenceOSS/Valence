import { describe, expect, it } from 'vitest';
import { book, mediaItem, series } from '#dialect/Schema';
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

  it('names who reads the audiobooks of a series the library holds', async () => {
    const { db } = await aHousehold();

    await db.insert(book).values([
      {
        id: 'one',
        libraryId: 'music',
        path: '/books/One',
        title: 'One',
        layout: 'audio',
        direction: 'leftToRight',
        seriesName: 'A Series',
        narrators: ['A Reader'],
      },
      {
        id: 'two',
        libraryId: 'music',
        path: '/books/Two',
        title: 'Two',
        layout: 'reflow',
        direction: 'leftToRight',
        seriesName: 'A Series',
        narrators: ['Nobody'],
      },
    ]);

    const lookup = createDatabaseCatalogueLookup(db);

    expect(await lookup.seriesNarrators('a series')).toEqual(['A Reader']);
    expect(await lookup.seriesNarrators('Another Series')).toEqual([]);
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

  it('lists every film and series held for the Catalogue, and the files of each', async () => {
    const { db } = await aHousehold();
    const file = {
      libraryId: 'films',
      title: 'Something',
      sizeBytes: 10,
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
      id: 'held-show',
      libraryId: 'films',
      key: 'folder:/films/Show',
      title: 'Show',
      externalId: '4242',
    });
    await db.insert(mediaItem).values([
      {
        ...file,
        id: 'held-film',
        path: '/films/Film (2020)/Film.mkv',
        externalId: '7007',
        year: 2020,
      },
      {
        ...file,
        id: 'held-e1',
        seriesId: 'held-show',
        path: '/films/Show/Season 1/a.mkv',
        seasonNumber: 1,
        episodeNumber: 1,
        year: 2019,
      },
      {
        ...file,
        id: 'held-e2',
        seriesId: 'held-show',
        path: '/films/Show/Season 1/b.mkv',
        seasonNumber: 1,
        episodeNumber: 2,
        year: 2019,
      },
    ]);

    const lookup = createDatabaseCatalogueLookup(db);

    expect(await lookup.heldTitles()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'film',
          id: 'held-film',
          catalogueId: '7007',
          year: 2020,
          held: 1,
          art: { kind: 'media', id: 'held-film' },
        }),
        expect.objectContaining({
          kind: 'series',
          id: 'held-show',
          catalogueId: '4242',
          held: 2,
          year: 2019,
          art: { kind: 'media', id: 'held-e1' },
        }),
      ]),
    );
    const episodes = await lookup.titleFiles('series', '4242');

    expect(episodes.folder).toBe('/films/Show');
    expect(episodes.files.find((one) => one.mediaId === 'held-e2')).toMatchObject({
      season: 1,
      episode: 2,
      height: 1080,
    });
    expect(await lookup.titleFiles('film', '7007')).toMatchObject({
      folder: null,
      files: [{ mediaId: 'held-film', path: '/films/Film (2020)/Film.mkv' }],
    });
    expect(await lookup.titleFiles('album', 'x')).toEqual({ folder: null, files: [] });
  });
});
