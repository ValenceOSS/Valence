import { describe, expect, it } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { findAppleArtistPictureUrl } from './findAppleArtistPictureUrl';

const FOUND = {
  'itunes.apple.com/search': {
    results: [
      { artistId: 3, artistName: 'Sleep Token', artistLinkUrl: 'https://music.apple.com/st' },
    ],
  },
};

describe('findAppleArtistPictureUrl', () => {
  it('takes the artist photograph their Apple Music page shares, large', async () => {
    const web = aWebThatAnswers(FOUND, {
      'music.apple.com/st':
        '<meta property="og:image" content="https://img/image/thumb/AMCArtistImages/x/1200x630cw.png">',
    });

    expect(await findAppleArtistPictureUrl(web, 'Sleep Token')).toBe(
      'https://img/image/thumb/AMCArtistImages/x/1200x1200cc.jpg',
    );
  });

  it('reads the picture whichever way round the page writes it', async () => {
    const web = aWebThatAnswers(FOUND, {
      'music.apple.com/st':
        '<meta content="https://img/image/thumb/AMCArtistImages/y/600x600bb.jpg" property="og:image">',
    });

    expect(await findAppleArtistPictureUrl(web, 'Sleep Token')).toBe(
      'https://img/image/thumb/AMCArtistImages/y/1200x1200cc.jpg',
    );
  });

  it('takes nothing where the page offers Apple Music’s own artwork rather than a face', async () => {
    const web = aWebThatAnswers(FOUND, {
      'music.apple.com/st':
        '<meta property="og:image" content="https://img/image/thumb/Features/apple-music.png">',
    });

    expect(await findAppleArtistPictureUrl(web, 'Sleep Token')).toBeNull();
  });

  it('takes nothing where the artist has no page', async () => {
    const web = aWebThatAnswers({
      'itunes.apple.com/search': { results: [{ artistId: 3, artistName: 'Sleep Token' }] },
    });

    expect(await findAppleArtistPictureUrl(web, 'Sleep Token')).toBeNull();
    expect(web.text).not.toHaveBeenCalled();
  });

  it('takes nothing where the page cannot be read', async () => {
    expect(await findAppleArtistPictureUrl(aWebThatAnswers(FOUND), 'Sleep Token')).toBeNull();
  });
});
