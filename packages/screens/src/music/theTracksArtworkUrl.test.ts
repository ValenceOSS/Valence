import { afterEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theTracksArtworkUrl } from './theTracksArtworkUrl';

afterEach(() => {
  forgetPlatform();
});

describe('theTracksArtworkUrl', () => {
  it('joins the server this client was told to watch to the cover path', () => {
    installPlatform(
      aFakePlatform({
        store: { read: () => 'https://valence.example.com', write: () => {}, forget: () => {} },
      }),
    );

    expect(theTracksArtworkUrl('an-album', true)).toBe(
      'https://valence.example.com/api/music/albums/an-album/artwork',
    );
  });

  it('gives nothing where the catalogue has no cover to fetch', () => {
    installPlatform(
      aFakePlatform({
        store: { read: () => 'https://valence.example.com', write: () => {}, forget: () => {} },
      }),
    );

    expect(theTracksArtworkUrl('an-album', false)).toBeNull();
  });

  it('gives nothing where this client has no server to fetch it from', () => {
    installPlatform(
      aFakePlatform({ store: { read: () => null, write: () => {}, forget: () => {} } }),
    );

    expect(theTracksArtworkUrl('an-album', true)).toBeNull();
  });
});
