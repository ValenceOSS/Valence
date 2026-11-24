import type { MusicArtist } from '@ValenceContracts/schemas/Music';

/**
 * An artist to draw the television's music against, numbered so each is told apart.
 *
 * @param n - Which artist it is.
 * @param change - Anything about them that differs.
 * @returns The artist.
 */
const aMusicArtist = (n: number, change: Partial<MusicArtist> = {}): MusicArtist => ({
  id: `00000000-0000-4000-8000-${(200 + n).toString().padStart(12, '0')}`,
  libraryId: '00000000-0000-4000-8000-000000000001',
  name: `Artist ${n.toString()}`,
  hasImage: false,
  imageAlbumId: null,
  albumCount: 1,
  trackCount: 10,
  isFavourite: false,
  ...change,
});

export { aMusicArtist };
