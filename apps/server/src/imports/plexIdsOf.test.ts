import { describe, expect, it } from 'vitest';
import { plexIdsOf } from './plexIdsOf';

describe('plexIdsOf', () => {
  it('reads the new agents’ Guid list', () => {
    expect(
      plexIdsOf({
        guid: 'plex://movie/1',
        Guid: [{ id: 'imdb://tt1' }, { id: 'tmdb://2' }, { id: 'tvdb://3' }],
      }),
    ).toMatchObject({ imdb: 'tt1', tmdb: '2', tvdb: '3' });
  });

  it('reads a legacy agent’s guid', () => {
    expect(plexIdsOf({ guid: 'com.plexapp.agents.themoviedb://603?lang=en' }).tmdb).toBe('603');
    expect(plexIdsOf({ guid: 'com.plexapp.agents.thetvdb://12345/1/2?lang=en' }).tvdb).toBe(
      '12345',
    );
  });

  it('reads MusicBrainz ids as whatever the item is', () => {
    expect(plexIdsOf({ Guid: [{ id: 'mbid://abc' }] }, 'musicBrainzAlbum').musicBrainzAlbum).toBe(
      'abc',
    );
    expect(plexIdsOf({ Guid: [{ id: 'mbid://abc' }] }).musicBrainzAlbum).toBeNull();
  });
});
