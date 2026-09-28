import { describe, expect, it } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { findDeezerArtistPictureUrl } from './findDeezerArtistPictureUrl';

describe('findDeezerArtistPictureUrl', () => {
  it('takes the photograph of the artist whose name is the one asked for', async () => {
    const web = aWebThatAnswers({
      'api.deezer.com/search/artist': {
        data: [
          { name: 'Pink Floyd Tribute', picture_xl: 'https://e/artist/aa/1000x1000.jpg' },
          { name: 'Pink Floyd', picture_xl: 'https://e/artist/bb/1000x1000.jpg' },
        ],
      },
    });

    expect(await findDeezerArtistPictureUrl(web, 'pink floyd')).toBe(
      'https://e/artist/bb/1000x1000.jpg',
    );
    expect(web.json).toHaveBeenCalledWith(
      'https://api.deezer.com/search/artist?q=pink%20floyd&limit=5',
    );
  });

  it('takes nothing where Deezer has only its blank stand-in', async () => {
    const web = aWebThatAnswers({
      'api.deezer.com/search/artist': {
        data: [{ name: 'Pink Floyd', picture_xl: 'https://e/images/artist//1000x1000.jpg' }],
      },
    });

    expect(await findDeezerArtistPictureUrl(web, 'Pink Floyd')).toBeNull();
  });

  it('takes nothing where no name matches', async () => {
    const web = aWebThatAnswers({
      'api.deezer.com/search/artist': { data: [{ name: 'Someone', picture_xl: 'https://e/1' }] },
    });

    expect(await findDeezerArtistPictureUrl(web, 'Pink Floyd')).toBeNull();
  });

  it('takes nothing where Deezer does not answer', async () => {
    expect(await findDeezerArtistPictureUrl(aWebThatAnswers({}), 'Pink Floyd')).toBeNull();
  });
});
