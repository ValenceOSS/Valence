import { describe, expect, it } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { findAppleArtist } from './findAppleArtist';

describe('findAppleArtist', () => {
  it('finds the artist whose name is the one asked for, with their Apple Music page', async () => {
    const web = aWebThatAnswers({
      'itunes.apple.com/search': {
        results: [
          { artistId: 1, artistName: 'Sleep Token Tribute Band', artistLinkUrl: 'https://x/1' },
          { artistId: 2, artistName: 'Sleep Token', artistLinkUrl: 'https://music.apple.com/2' },
        ],
      },
    });

    expect(await findAppleArtist(web, 'sleep token')).toEqual({
      id: 2,
      link: 'https://music.apple.com/2',
    });
    expect(web.json).toHaveBeenCalledWith(
      'https://itunes.apple.com/search?term=sleep%20token&entity=musicArtist&limit=5',
    );
  });

  it('finds nobody where no name matches', async () => {
    const web = aWebThatAnswers({
      'itunes.apple.com/search': { results: [{ artistId: 1, artistName: 'Someone Else' }] },
    });

    expect(await findAppleArtist(web, 'Sleep Token')).toBeNull();
  });

  it('finds nobody where the catalogue does not answer', async () => {
    expect(await findAppleArtist(aWebThatAnswers({}), 'Sleep Token')).toBeNull();
  });
});
