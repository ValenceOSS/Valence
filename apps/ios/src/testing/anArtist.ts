import { MusicArtistSchema } from '@ValenceContracts/schemas/Music';
import type { MusicArtist } from '@ValenceContracts/schemas/Music';

/**
 * An artist to draw a screen against.
 *
 * @param overrides - Anything about them that matters to the test.
 * @returns The artist.
 */
const anArtist = (overrides: Partial<MusicArtist> = {}): MusicArtist =>
  MusicArtistSchema.parse({
    id: '00000000-0000-4000-8000-00000000a7a7',
    libraryId: '00000000-0000-4000-8000-00000000f1f1',
    name: 'Sleep Token',
    hasImage: false,
    imageAlbumId: null,
    albumCount: 4,
    trackCount: 40,
    isFavourite: false,
    ...overrides,
  });

export { anArtist };
