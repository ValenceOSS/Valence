import { describe, expect, it } from 'vitest';
import { aSourceItem } from './aSourceToImport';
import { matchSourceItem } from './matchSourceItem';
import { NO_IDS } from './NO_IDS';
import type { ValenceIndex } from './readValenceIndex';
import type { SourceItem } from './SourceReader';

/**
 * An index holding only what a test gives it.
 *
 * @param changes - The lookups that hold anything.
 * @returns The index.
 */
const anIndex = (changes: Partial<ValenceIndex>): ValenceIndex => ({
  filmsByTmdb: new Map(),
  filmsByImdb: new Map(),
  filmsByTitle: new Map(),
  byPath: new Map(),
  episodesByTmdb: new Map(),
  episodesByTitle: new Map(),
  seriesByTmdb: new Map(),
  seriesByTitle: new Map(),
  tracksByAlbumId: new Map(),
  tracksByAlbumTitle: new Map(),
  artistsByMusicBrainz: new Map(),
  artistsByName: new Map(),
  durations: new Map(),
  kinds: new Map(),
  ...changes,
});

/**
 * Matches an item against an index.
 *
 * @param item - The item.
 * @param index - What Valence holds.
 * @param parents - The source's programmes and albums.
 * @returns The match.
 */
const match = (item: SourceItem, index: ValenceIndex, parents: SourceItem[] = []) =>
  matchSourceItem(item, {
    index,
    mappings: [{ from: '/data', to: '/media' }],
    parents: new Map(parents.map((parent) => [parent.id, parent])),
    tmdbOfTvdb: new Map([['79126', '1438']]),
  });

const FILM = aSourceItem({
  id: 'f',
  kind: 'movie',
  title: 'Heat',
  year: 1995,
  path: '/data/films/Heat.mkv',
});

describe('matchSourceItem', () => {
  it('matches a film by its TMDb id first, then its IMDb id', () => {
    const index = anIndex({
      filmsByTmdb: new Map([['949', ['a']]]),
      filmsByImdb: new Map([['tt1', ['b']]]),
    });

    expect(match({ ...FILM, ids: { ...NO_IDS, tmdb: '949', imdb: 'TT1' } }, index)).toEqual({
      kind: 'item',
      mediaItemId: 'a',
      by: 'id',
    });
    expect(match({ ...FILM, ids: { ...NO_IDS, imdb: 'TT1' } }, index)).toEqual({
      kind: 'item',
      mediaItemId: 'b',
      by: 'id',
    });
  });

  it('matches a film by where its file is, through the mappings', () => {
    expect(match(FILM, anIndex({ byPath: new Map([['/media/films/Heat.mkv', 'c']]) }))).toEqual({
      kind: 'item',
      mediaItemId: 'c',
      by: 'path',
    });
  });

  it('matches a film by its title and year, allowing the year to be one out, but never guesses between two', () => {
    expect(match(FILM, anIndex({ filmsByTitle: new Map([['heat|1996', ['d']]]) }))).toEqual({
      kind: 'item',
      mediaItemId: 'd',
      by: 'title',
    });
    expect(
      match({ ...FILM, year: null }, anIndex({ filmsByTitle: new Map([['heat|', ['e']]]) })),
    ).toEqual({
      kind: 'item',
      mediaItemId: 'e',
      by: 'title',
    });
    expect(
      match(FILM, anIndex({ filmsByTitle: new Map([['heat|1995', ['d', 'e']]]) })),
    ).toMatchObject({
      kind: 'unmatched',
      reason: { code: 'server.imports.matchSourceItem.moreThanOneMatches' },
    });
    expect(match(FILM, anIndex({}))).toMatchObject({
      reason: { code: 'server.imports.matchSourceItem.nothingMatches' },
    });
  });

  it('matches a programme by its TMDb id, a TVDB id looked up, or its title', () => {
    const show = aSourceItem({ id: 's', kind: 'series', title: 'The Wire' });
    const index = anIndex({
      seriesByTmdb: new Map([['1438', 'wire']]),
      seriesByTitle: new Map([['wire', ['by-title']]]),
    });

    expect(match({ ...show, ids: { ...NO_IDS, tvdb: '79126' } }, index)).toEqual({
      kind: 'series',
      seriesId: 'wire',
      by: 'id',
    });
    expect(match(show, index)).toEqual({ kind: 'series', seriesId: 'by-title', by: 'title' });
    expect(match(show, anIndex({ seriesByTitle: new Map([['wire', ['a', 'b']]]) }))).toMatchObject({
      reason: { code: 'server.imports.matchSourceItem.moreThanOneMatches' },
    });
    expect(match(show, anIndex({}))).toMatchObject({
      reason: { code: 'server.imports.matchSourceItem.nothingMatches' },
    });
  });

  it('matches an episode by its programme and number, then its file, then its programme’s title', () => {
    const show = aSourceItem({
      id: 's',
      kind: 'series',
      title: 'The Wire',
      ids: { ...NO_IDS, tvdb: '79126' },
    });
    const episode = aSourceItem({
      id: 'e',
      kind: 'episode',
      title: 'The Target',
      seriesId: 's',
      seasonNumber: 1,
      episodeNumber: 1,
      path: '/data/tv/e.mkv',
    });

    expect(
      match(episode, anIndex({ episodesByTmdb: new Map([['1438|1|1', 'a']]) }), [show]),
    ).toEqual({ kind: 'item', mediaItemId: 'a', by: 'id' });
    expect(
      match(episode, anIndex({ byPath: new Map([['/media/tv/e.mkv', 'b']]) }), [show]),
    ).toEqual({ kind: 'item', mediaItemId: 'b', by: 'path' });
    expect(
      match(episode, anIndex({ episodesByTitle: new Map([['wire|1|1', ['c']]]) }), [show]),
    ).toEqual({ kind: 'item', mediaItemId: 'c', by: 'title' });
    expect(match({ ...episode, episodeNumber: null }, anIndex({}), [show])).toMatchObject({
      kind: 'unmatched',
    });
    expect(match({ ...episode, seriesId: null, path: null }, anIndex({}))).toMatchObject({
      kind: 'unmatched',
    });
  });

  it('matches a track by its album’s MusicBrainz id and position, then its file, then its album’s title', () => {
    const album = aSourceItem({
      id: 'a',
      kind: 'album',
      title: 'Blue Lines',
      ids: { ...NO_IDS, musicBrainzReleaseGroup: 'RG' },
    });
    const track = aSourceItem({
      id: 't',
      kind: 'track',
      title: 'Song',
      albumId: 'a',
      trackNumber: 3,
      path: '/data/music/t.flac',
    });

    expect(match(track, anIndex({ tracksByAlbumId: new Map([['rg|1|3', 'x']]) }), [album])).toEqual(
      { kind: 'item', mediaItemId: 'x', by: 'id' },
    );
    expect(
      match(track, anIndex({ byPath: new Map([['/media/music/t.flac', 'y']]) }), [album]),
    ).toEqual({ kind: 'item', mediaItemId: 'y', by: 'path' });
    expect(
      match(track, anIndex({ tracksByAlbumTitle: new Map([['blue lines|1|3', ['z']]]) }), [album]),
    ).toEqual({ kind: 'item', mediaItemId: 'z', by: 'title' });
    expect(match({ ...track, trackNumber: null, path: null }, anIndex({}), [album])).toMatchObject({
      kind: 'unmatched',
    });
  });

  it('says Valence keeps nothing like an artist or a photo', () => {
    expect(
      match(aSourceItem({ id: 'o', kind: 'other', title: 'Photo' }), anIndex({})),
    ).toMatchObject({
      reason: { code: 'server.imports.matchSourceItem.valenceKeepsNothingLikeIt' },
    });
  });
});
