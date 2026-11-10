import { describe, expect, it, vi } from 'vitest';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { artistPictureOf } from './artistPictureOf';

const SAM: Viewer = { kind: 'account', accountId: 'a1', profileId: 'p1', isAdministrator: false };

/**
 * A music service with one pictured artist, one pictured only by an album, and one with neither.
 *
 * @returns The fake.
 */
const aLibrary = () => ({
  readArtistImage: vi.fn((_viewer: Viewer, artistId: string) =>
    Promise.resolve(artistId === 'pictured' ? '/art/pictured.webp' : null),
  ),
  readArtist: vi.fn((_viewer: Viewer, artistId: string) =>
    Promise.resolve(
      artistId === 'nobody'
        ? null
        : {
            artist: {
              id: artistId,
              libraryId: 'music',
              name: 'Mara Quill',
              hasImage: false,
              imageAlbumId: artistId === 'by-album' ? 'al1' : null,
              albumCount: 1,
              trackCount: 1,
              isFavourite: false,
            },
            albums: [],
            appearsOn: [],
            popular: [],
          },
    ),
  ),
  readAlbumArtwork: vi.fn((_viewer: Viewer, albumId: string) =>
    Promise.resolve(albumId === 'al1' ? '/art/al1.webp' : null),
  ),
});

describe('artistPictureOf', () => {
  it('gives an artist’s own picture first', async () => {
    const library = aLibrary();

    await expect(artistPictureOf(library, SAM, 'pictured')).resolves.toBe('/art/pictured.webp');
    expect(library.readArtist).not.toHaveBeenCalled();
  });

  it('falls back to the album cover Valence pictures them by', async () => {
    await expect(artistPictureOf(aLibrary(), SAM, 'by-album')).resolves.toBe('/art/al1.webp');
  });

  it('gives nothing for an artist with neither, or one the person can’t see', async () => {
    await expect(artistPictureOf(aLibrary(), SAM, 'bare')).resolves.toBeNull();
    await expect(artistPictureOf(aLibrary(), SAM, 'nobody')).resolves.toBeNull();
  });
});
