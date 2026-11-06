import { describe, expect, it } from 'vitest';
import { subjectKeysOf } from './subjectKeysOf';

const FILE = {
  path: '/films/A film (2001)/A film.mkv',
  externalId: '603',
  seriesKey: null,
  seasonNumber: null,
  episodeNumber: null,
  catalogueEpisodeId: null,
  extraKind: null,
};

describe('subjectKeysOf', () => {
  it('keys a matched film by its catalogue id, and an unmatched one by its file', () => {
    expect(subjectKeysOf(FILE)).toEqual({ kind: 'film', film: 'movie:603' });
    expect(subjectKeysOf({ ...FILE, externalId: null })).toEqual({
      kind: 'film',
      film: `file:${FILE.path}`,
    });
  });

  it('keys an episode by the catalogue’s own id for it, so its number can change', () => {
    expect(
      subjectKeysOf({
        ...FILE,
        externalId: '1399',
        seriesKey: 'folder:/shows/A show',
        seasonNumber: 2,
        episodeNumber: 5,
        catalogueEpisodeId: '63056',
      }),
    ).toEqual({
      kind: 'episode',
      show: 'tv:1399',
      season: 'tv:1399:s2',
      episode: 'tv:1399:e63056',
    });
  });

  it('keys an unmatched episode by its programme’s own key and its numbers', () => {
    expect(
      subjectKeysOf({
        ...FILE,
        externalId: null,
        seriesKey: 'folder:/shows/A show',
        seasonNumber: 1,
        episodeNumber: 3,
      }),
    ).toEqual({
      kind: 'episode',
      show: 'series:folder:/shows/A show',
      season: 'series:folder:/shows/A show:s1',
      episode: 'series:folder:/shows/A show:s1e3',
    });
  });

  it('holds no edits for an extra', () => {
    expect(subjectKeysOf({ ...FILE, extraKind: 'trailer' })).toEqual({ kind: 'none' });
  });
});
