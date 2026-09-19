import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { syncItems } from './syncItems';

const SERIES = aMediaRequest({ kind: 'series', title: 'Severance', seasons: null });

const EPISODES = [
  { season: 0, episode: 1, title: 'Behind the scenes', airDate: '2022-01-01' },
  { season: 1, episode: 1, title: 'Good News About Hell', airDate: '2022-02-18' },
  { season: 1, episode: 2, title: 'Half Loop', airDate: '2022-02-18' },
  { season: 2, episode: 1, title: 'Hello, Ms. Cobel', airDate: null },
];

const NOTHING = { episodes: [], albums: [] };

const ALBUMS = [
  {
    id: '1',
    title: 'The Piper at the Gates of Dawn',
    type: 'album' as const,
    firstReleased: '1967-08-04',
  },
  { id: '2', title: 'Pulse', type: 'live' as const, firstReleased: '1995-05-29' },
  { id: '3', title: 'Arnold Layne', type: 'single' as const, firstReleased: '1967-03-10' },
  { id: '4', title: 'The Final Cut', type: 'album' as const, firstReleased: null },
  { id: '5', title: 'An Interview', type: null, firstReleased: null },
];

const ARTIST = aMediaRequest({
  kind: 'artist',
  tmdbId: null,
  musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
  title: 'Pink Floyd',
  artistName: 'Pink Floyd',
  releaseTypes: ['album', 'live'],
});

describe('syncItems', () => {
  it('waits for a film until its release', () => {
    expect(syncItems(aMediaRequest(), NOTHING, []).add).toEqual([
      { musicBrainzId: null, season: null, episode: null, title: 'Dune', airDate: '2021-12-03' },
    ]);
  });

  it('waits for every regular episode where no seasons were named', () => {
    expect(
      syncItems(SERIES, { episodes: EPISODES, albums: [] }, []).add.map((item) => item.title),
    ).toEqual(['Good News About Hell', 'Half Loop', 'Hello, Ms. Cobel']);
  });

  it('waits for the seasons named, specials included', () => {
    expect(
      syncItems({ ...SERIES, seasons: [0, 2] }, { episodes: EPISODES, albums: [] }, []).add.map(
        (item) => item.title,
      ),
    ).toEqual(['Behind the scenes', 'Hello, Ms. Cobel']);
  });

  it('changes what the catalogue renamed or re-dated, and adds only what is new', () => {
    const kept = aRequestItem({ season: 1, episode: 1, title: 'Pilot', airDate: '2022-02-18' });
    const changes = syncItems(SERIES, { episodes: EPISODES, albums: [] }, [kept]);

    expect(changes.change).toEqual([
      { id: kept.id, changes: { title: 'Good News About Hell', airDate: '2022-02-18' } },
    ]);
    expect(changes.add).toHaveLength(2);
  });

  it('lets go of what is no longer asked for, unless it is coming or here', () => {
    const wanted = aRequestItem({ id: 'wanted', season: 2, episode: 1, state: 'wanted' });
    const coming = aRequestItem({ id: 'coming', season: 2, episode: 2, state: 'downloading' });

    expect(
      syncItems({ ...SERIES, seasons: [1] }, { episodes: EPISODES, albums: [] }, [wanted, coming])
        .remove,
    ).toEqual(['wanted']);
  });

  it('waits for an artist’s albums of the kinds asked for, by their MusicBrainz ids', () => {
    expect(syncItems(ARTIST, { episodes: [], albums: ALBUMS }, []).add).toEqual([
      {
        musicBrainzId: '1',
        season: null,
        episode: null,
        title: 'The Piper at the Gates of Dawn',
        airDate: '1967-08-04',
      },
      { musicBrainzId: '2', season: null, episode: null, title: 'Pulse', airDate: '1995-05-29' },
      { musicBrainzId: '4', season: null, episode: null, title: 'The Final Cut', airDate: null },
    ]);
  });

  it('waits for an artist’s albums alone where no kinds were named', () => {
    expect(
      syncItems({ ...ARTIST, releaseTypes: null }, { episodes: [], albums: ALBUMS }, []).add.map(
        (item) => item.title,
      ),
    ).toEqual(['The Piper at the Gates of Dawn', 'The Final Cut']);
  });

  it('waits for the one album asked for, and adds nothing it has already', () => {
    const album = { ...ARTIST, kind: 'album' as const, musicBrainzId: '2', releaseTypes: null };
    const kept = aRequestItem({ musicBrainzId: '2', title: 'Pulse', airDate: '1995-05-29' });

    expect(
      syncItems(album, { episodes: [], albums: ALBUMS }, []).add.map((item) => item.title),
    ).toEqual(['Pulse']);
    expect(syncItems(album, { episodes: [], albums: ALBUMS }, [kept])).toEqual({
      add: [],
      change: [],
      remove: [],
    });
  });
});
