import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { rowForAnAlbum } from './rowForAnAlbum';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://valence.test' }));
});

describe('rowForAnAlbum', () => {
  it('names the album and its artist, and plays rather than opens', () => {
    const row = rowForAnAlbum(anAlbum());

    expect(row).toEqual({
      id: 'album:00000000-0000-4000-8000-00000000a1b1',
      title: 'Even In Arcadia',
      detail: 'Sleep Token',
      artwork: null,
      opens: false,
    });
  });

  it('gives the whole address of a cover the album has', () => {
    expect(rowForAnAlbum(anAlbum({ hasArtwork: true })).artwork).toBe(
      'http://valence.test/api/music/albums/00000000-0000-4000-8000-00000000a1b1/artwork',
    );
  });
});
