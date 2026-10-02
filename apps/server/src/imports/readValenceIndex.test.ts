import { describe, expect, it } from 'vitest';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import {
  ALBUM_MUSICBRAINZ,
  ARTIST_MUSICBRAINZ,
  aLibraryToImportInto,
} from './aLibraryToImportInto';
import { readValenceIndex } from './readValenceIndex';

describe('readValenceIndex', { timeout: 60_000 }, () => {
  it('indexes films, episodes, programmes, tracks and artists the ways an import matches them', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const index = await readValenceIndex(db);

    expect(index.filmsByTmdb.get('949')).toEqual(['heat']);
    expect(index.filmsByImdb.get('tt0113277')).toEqual(['heat']);
    expect(index.filmsByTitle.get('heat|1995')).toEqual(['heat']);
    expect(index.byPath.get('/media/tv/The Wire/Season 01/S01E02.mkv')).toBe('wire-102');
    expect(index.episodesByTmdb.get('1438|1|1')).toBe('wire-101');
    expect(index.episodesByTitle.get('wire|1|2')).toEqual(['wire-102']);
    expect(index.seriesByTmdb.get('1438')).toBe('wire');
    expect(index.seriesByTitle.get('wire')).toEqual(['wire']);
    expect(index.tracksByAlbumId.get(`${ALBUM_MUSICBRAINZ}|1|3`)).toBe('unfinished');
    expect(index.tracksByAlbumTitle.get('blue lines|1|3')).toEqual(['unfinished']);
    expect(index.artistsByMusicBrainz.get(ARTIST_MUSICBRAINZ)).toBe('massive');
    expect(index.artistsByName.get('massive attack')).toEqual(['massive']);
    expect(index.durations.get('heat')).toBe(10200);
    expect(index.kinds.get('unfinished')).toBe('track');
    expect(index.kinds.get('wire-101')).toBe('episode');
    expect(index.filmsByTmdb.has('1438')).toBe(false);
  });
});
