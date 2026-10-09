import { describe, expect, it } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { describeAppleAlbum } from './describeAppleAlbum';

const ALBUM = {
  'itunes.apple.com/search': {
    results: [{ artistId: 7, artistName: 'Sabrina Carpenter' }],
  },
  'entity=album': {
    results: [
      {
        wrapperType: 'collection',
        collectionId: 1752214909,
        collectionName: 'Short n’ Sweet',
        collectionViewUrl: 'https://music.apple.com/us/album/short-n-sweet/1752214909?uo=4',
        artworkUrl100: 'https://img/a/100x100bb.jpg',
        primaryGenreName: 'Pop',
        copyright: '℗ 2024 Island Records, a division of UMG Recordings, Inc.',
      },
    ],
  },
  'entity=song': {
    results: [
      { wrapperType: 'collection', collectionId: 1752214909 },
      {
        wrapperType: 'track',
        kind: 'song',
        discNumber: 1,
        trackNumber: 2,
        trackName: 'Espresso',
        trackTimeMillis: 175_459,
      },
      {
        wrapperType: 'track',
        kind: 'song',
        discNumber: 1,
        trackNumber: 1,
        trackName: 'Taste',
        trackTimeMillis: 157_280,
      },
      { wrapperType: 'track', kind: 'music-video', trackNumber: 3, trackName: 'Espresso (Video)' },
    ],
  },
};

const PAGE = `<script id="serialized-server-data">${JSON.stringify({
  modalPresentationDescriptor: { paragraphText: 'Some people kill their nemeses with kindness.' },
})}</script>`;

describe('describeAppleAlbum', () => {
  it('says what Apple Music knows of an album: its notes, genre, label and songs in order', async () => {
    const web = aWebThatAnswers(ALBUM, { 'music.apple.com/us/album/short-n-sweet': PAGE });

    expect(
      await describeAppleAlbum(web, { title: 'Short n’ Sweet', artistName: 'Sabrina Carpenter' }),
    ).toEqual({
      notes: 'Some people kill their nemeses with kindness.',
      genre: 'Pop',
      label: 'Island Records, a division of UMG Recordings, Inc.',
      tracks: [
        { disc: 1, number: 1, title: 'Taste', seconds: 157 },
        { disc: 1, number: 2, title: 'Espresso', seconds: 175 },
      ],
    });
    expect(web.text).toHaveBeenCalledWith(
      'https://music.apple.com/us/album/short-n-sweet/1752214909',
    );
  });

  it('keeps the songs and the rest where the page has no notes', async () => {
    const web = aWebThatAnswers(ALBUM);

    expect(
      await describeAppleAlbum(web, { title: 'Short n’ Sweet', artistName: 'Sabrina Carpenter' }),
    ).toMatchObject({ notes: null, genre: 'Pop' });
  });

  it('says nothing of an album Apple Music does not have', async () => {
    expect(
      await describeAppleAlbum(aWebThatAnswers({}), { title: 'Nope', artistName: 'Nobody' }),
    ).toBeNull();
  });
});
