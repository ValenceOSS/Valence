import { describe, expect, it } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { findAppleAlbum } from './findAppleAlbum';

const ARTIST = {
  'itunes.apple.com/search': { results: [{ artistId: 7, artistName: 'Bloc Party' }] },
};

describe('findAppleAlbum', () => {
  it('finds the artist’s own album of that title, the one with a cover first', async () => {
    const web = aWebThatAnswers({
      ...ARTIST,
      'itunes.apple.com/lookup': {
        results: [
          { wrapperType: 'artist' },
          { wrapperType: 'collection', collectionId: 1, collectionName: 'Silent Alarm' },
          {
            wrapperType: 'collection',
            collectionId: 2,
            collectionName: 'Silent Alarm - EP',
            collectionViewUrl: 'https://music.apple.com/album/2?uo=4',
            artworkUrl100: 'https://img/a/100x100bb.jpg',
            primaryGenreName: 'Alternative',
            copyright: '℗ 2005 Wichita',
          },
        ],
      },
    });

    expect(
      await findAppleAlbum(web, { title: 'Silent Alarm (2005)', artistName: 'Bloc Party' }),
    ).toEqual({
      id: 2,
      link: 'https://music.apple.com/album/2?uo=4',
      artworkUrl: 'https://img/a/100x100bb.jpg',
      genre: 'Alternative',
      copyright: '℗ 2005 Wichita',
    });
  });

  it('finds nothing where the artist is unknown or has no album of that title', async () => {
    const unknown = aWebThatAnswers({});
    const elsewhere = aWebThatAnswers({
      ...ARTIST,
      'itunes.apple.com/lookup': {
        results: [{ wrapperType: 'collection', collectionId: 3, collectionName: 'Intimacy' }],
      },
    });

    expect(await findAppleAlbum(unknown, { title: 'Intimacy', artistName: 'Nobody' })).toBeNull();
    expect(
      await findAppleAlbum(elsewhere, { title: 'Silent Alarm', artistName: 'Bloc Party' }),
    ).toBeNull();
  });
});
