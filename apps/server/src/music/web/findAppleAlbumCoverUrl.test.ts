import { describe, expect, it } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { findAppleAlbumCoverUrl } from './findAppleAlbumCoverUrl';

const ARTIST = {
  'itunes.apple.com/search': { results: [{ artistId: 7, artistName: 'Bloc Party' }] },
};

describe('findAppleAlbumCoverUrl', () => {
  it('finds the cover of the artist’s own album of that title, large', async () => {
    const web = aWebThatAnswers({
      ...ARTIST,
      'itunes.apple.com/lookup': {
        results: [
          { wrapperType: 'artist' },
          {
            wrapperType: 'collection',
            collectionName: 'Silent Alarm - EP',
            artworkUrl100: 'https://img/a/100x100bb.jpg',
          },
        ],
      },
    });

    expect(
      await findAppleAlbumCoverUrl(web, { title: 'Silent Alarm (2005)', artistName: 'Bloc Party' }),
    ).toBe('https://img/a/1200x1200cc.jpg');
    expect(web.json).toHaveBeenCalledWith(
      'https://itunes.apple.com/lookup?id=7&entity=album&limit=200',
    );
  });

  it('finds nothing where the artist has no album of that title', async () => {
    const web = aWebThatAnswers({
      ...ARTIST,
      'itunes.apple.com/lookup': {
        results: [
          { wrapperType: 'collection', collectionName: 'Intimacy', artworkUrl100: 'https://img/b' },
        ],
      },
    });

    expect(
      await findAppleAlbumCoverUrl(web, { title: 'Silent Alarm', artistName: 'Bloc Party' }),
    ).toBeNull();
  });

  it('finds nothing where the album has no artwork listed', async () => {
    const web = aWebThatAnswers({
      ...ARTIST,
      'itunes.apple.com/lookup': {
        results: [
          { wrapperType: 'collection', collectionName: 'Silent Alarm', artworkUrl100: null },
        ],
      },
    });

    expect(
      await findAppleAlbumCoverUrl(web, { title: 'Silent Alarm', artistName: 'Bloc Party' }),
    ).toBeNull();
  });

  it('does not look for albums where the artist was not found', async () => {
    const web = aWebThatAnswers({});

    expect(
      await findAppleAlbumCoverUrl(web, { title: 'Silent Alarm', artistName: 'Bloc Party' }),
    ).toBeNull();
    expect(web.json).toHaveBeenCalledTimes(1);
  });
});
