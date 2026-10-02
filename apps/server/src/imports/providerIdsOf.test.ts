import { describe, expect, it } from 'vitest';
import { providerIdsOf } from './providerIdsOf';

describe('providerIdsOf', () => {
  it('reads the ids Valence matches on, whatever case their names are in', () => {
    expect(
      providerIdsOf({
        tmdb: '949',
        IMDB: 'tt0113277',
        Tvdb: ' ',
        MusicBrainzRecording: 'rec',
        MusicBrainzAlbumArtist: 'artist',
        TvRage: '1',
        Custom: null,
      }),
    ).toEqual({
      tmdb: '949',
      imdb: 'tt0113277',
      tvdb: null,
      musicBrainzTrack: 'rec',
      musicBrainzAlbum: null,
      musicBrainzReleaseGroup: null,
      musicBrainzArtist: 'artist',
    });
  });

  it('has nothing where an item has no ids', () => {
    expect(providerIdsOf(undefined).tmdb).toBeNull();
  });
});
