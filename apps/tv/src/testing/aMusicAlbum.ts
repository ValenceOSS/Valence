import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

/**
 * An album to draw the television's music against, numbered so each is told apart.
 *
 * @param n - Which album it is.
 * @param change - Anything about it that differs.
 * @returns The album.
 */
const aMusicAlbum = (n: number, change: Partial<MusicAlbum> = {}): MusicAlbum => ({
  id: `00000000-0000-4000-8000-${(100 + n).toString().padStart(12, '0')}`,
  libraryId: '00000000-0000-4000-8000-000000000001',
  title: `Album ${n.toString()}`,
  artist: { id: '00000000-0000-4000-8000-000000000002', name: 'Sleep Token' },
  year: 2025,
  genres: [],
  hasArtwork: true,
  isCompilation: false,
  trackCount: 10,
  durationSeconds: 3000,
  sizeBytes: 0,
  isExplicit: false,
  addedAt: '2026-01-01T00:00:00.000Z',
  ...change,
});

export { aMusicAlbum };
